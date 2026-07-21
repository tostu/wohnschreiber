import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { document, profile, selbstauskunft } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { saveGeneratedFile, deleteFile } from '$lib/server/storage';
import { buildSelbstauskunftPdf } from '$lib/server/pdf';
import { randomUUID } from 'node:crypto';

const YES_NO_VALUES = ['ja', 'nein', 'keine_angabe'] as const;
type YesNo = (typeof YES_NO_VALUES)[number];

function parseYesNo(value: FormDataEntryValue | null): YesNo {
	const str = value?.toString() ?? '';
	return (YES_NO_VALUES as readonly string[]).includes(str) ? (str as YesNo) : 'keine_angabe';
}

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [existing] = await db
		.select()
		.from(selbstauskunft)
		.where(eq(selbstauskunft.userId, user.id));

	if (existing) {
		return { answers: existing };
	}

	const [existingProfile] = await db.select().from(profile).where(eq(profile.userId, user.id));
	const [first, ...rest] = (existingProfile?.fullName ?? '').split(' ');

	return {
		answers: {
			firstName: first ?? '',
			lastName: rest.join(' '),
			email: user.email,
			aboutMe: existingProfile?.aboutMe ?? null
		}
	};
};

export const actions: Actions = {
	save: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();

		const anrede = formData.get('anrede')?.toString() ?? 'keine_angabe';
		const birthDate = formData.get('birthDate')?.toString() ?? '';
		const firstName = formData.get('firstName')?.toString().trim() ?? '';
		const lastName = formData.get('lastName')?.toString().trim() ?? '';
		const street = formData.get('street')?.toString().trim() ?? '';
		const city = formData.get('city')?.toString().trim() ?? '';
		const phone = formData.get('phone')?.toString().trim() ?? '';
		const email = formData.get('email')?.toString().trim() ?? '';
		const aboutMe = formData.get('aboutMe')?.toString().trim() || null;
		const occupationStatus = formData.get('occupationStatus')?.toString().trim() ?? '';
		const jobTitle = formData.get('jobTitle')?.toString().trim() || null;
		const employer = formData.get('employer')?.toString().trim() || null;
		const annualIncomeRaw = formData.get('annualIncome')?.toString().trim();
		const annualIncome = annualIncomeRaw ? parseInt(annualIncomeRaw, 10) : null;
		const moveReason = formData.get('moveReason')?.toString().trim() ?? '';
		const commercialUse = parseYesNo(formData.get('commercialUse'));
		const pets = parseYesNo(formData.get('pets'));
		const smoker = parseYesNo(formData.get('smoker'));
		const guarantee = parseYesNo(formData.get('guarantee'));
		const wbs = parseYesNo(formData.get('wbs'));
		const liabilityInsurance = parseYesNo(formData.get('liabilityInsurance'));
		const affidavitOfAssets = parseYesNo(formData.get('affidavitOfAssets'));
		const insolvency = parseYesNo(formData.get('insolvency'));
		const confirmedTruthful = formData.get('confirmedTruthful') === 'on';

		if (
			!birthDate ||
			!firstName ||
			!lastName ||
			!street ||
			!city ||
			!phone ||
			!email ||
			!occupationStatus ||
			!moveReason
		) {
			return fail(400, { message: 'Bitte fülle alle Pflichtfelder aus.' });
		}
		if (!confirmedTruthful) {
			return fail(400, { message: 'Bitte bestätige, dass die Angaben wahrheitsgemäß sind.' });
		}

		const values = {
			anrede,
			birthDate,
			firstName,
			lastName,
			street,
			city,
			phone,
			email,
			aboutMe,
			occupationStatus,
			jobTitle,
			employer,
			annualIncome,
			moveReason,
			commercialUse,
			pets,
			smoker,
			guarantee,
			wbs,
			liabilityInsurance,
			affidavitOfAssets,
			insolvency,
			confirmedTruthful
		};

		await db
			.insert(selbstauskunft)
			.values({ userId: user.id, ...values })
			.onConflictDoUpdate({ target: selbstauskunft.userId, set: values });

		const pdfBuffer = await buildSelbstauskunftPdf(values);
		const storagePath = await saveGeneratedFile(user.id, `selbstauskunft-${randomUUID()}.pdf`, pdfBuffer);

		const [existingDoc] = await db
			.select()
			.from(document)
			.where(and(eq(document.userId, user.id), eq(document.type, 'selbstauskunft')));

		if (existingDoc) {
			await deleteFile(existingDoc.storagePath);
			await db
				.update(document)
				.set({
					fileName: 'Selbstauskunft.pdf',
					storagePath,
					mimeType: 'application/pdf',
					uploadedAt: new Date()
				})
				.where(eq(document.id, existingDoc.id));
		} else {
			await db.insert(document).values({
				id: randomUUID(),
				userId: user.id,
				type: 'selbstauskunft',
				fileName: 'Selbstauskunft.pdf',
				storagePath,
				mimeType: 'application/pdf'
			});
		}

		redirect(303, '/documents');
	}
};
