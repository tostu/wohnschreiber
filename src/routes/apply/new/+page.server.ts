import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import {
	document,
	profile,
	listing,
	application,
	applicationDocument,
	coverTemplateValues,
	type CoverTemplate
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fetchListingInfo } from '$lib/server/listing-scraper';
import { generateCoverLetter } from '$lib/server/mistral';
import { buildApplicationPdf, type CoverPageData } from '$lib/server/pdf';
import { readFile, saveGeneratedFile } from '$lib/server/storage';
import { randomUUID } from 'node:crypto';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [userProfile] = await db.select().from(profile).where(eq(profile.userId, user.id));
	const docs = await db.select().from(document).where(eq(document.userId, user.id));
	return { profile: userProfile ?? null, documents: docs };
};

export const actions: Actions = {
	extract: async (event) => {
		requireUser(event);
		const formData = await event.request.formData();
		const url = formData.get('url')?.toString().trim();

		if (!url) {
			return { extracted: null };
		}

		const info = await fetchListingInfo(url);
		if (!info) {
			return fail(200, {
				extractionFailed: true,
				url,
				message:
					'Anzeige konnte nicht automatisch ausgelesen werden. Bitte Details manuell ausfüllen.'
			});
		}

		return { extracted: { ...info, url } };
	},

	generate: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();

		const [userProfile] = await db.select().from(profile).where(eq(profile.userId, user.id));
		if (!userProfile) {
			return fail(400, { message: 'Bitte zuerst deine Bewerberdaten unter /profile ausfüllen.' });
		}

		const title = formData.get('title')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() ?? '';
		const sourceUrl = formData.get('sourceUrl')?.toString().trim() || null;
		const rentRaw = formData.get('rent')?.toString().trim();
		const rent = rentRaw ? parseInt(rentRaw, 10) : null;
		const address = formData.get('address')?.toString().trim() || null;
		const contactName = formData.get('contactName')?.toString().trim() || null;
		const selectedDocumentIds = formData.getAll('documentIds').map((v) => v.toString());
		const coverTemplateRaw = formData.get('coverTemplate')?.toString();
		const coverTemplate: CoverTemplate = coverTemplateValues.includes(
			coverTemplateRaw as CoverTemplate
		)
			? (coverTemplateRaw as CoverTemplate)
			: 'none';

		if (!title || !description) {
			return fail(400, { message: 'Titel und Beschreibung der Anzeige werden benötigt.' });
		}

		const selectedDocs =
			selectedDocumentIds.length > 0
				? await db.select().from(document).where(eq(document.userId, user.id))
				: [];
		const docsToAttach = selectedDocs.filter((d) => selectedDocumentIds.includes(d.id));

		const listingId = randomUUID();
		await db.insert(listing).values({
			id: listingId,
			userId: user.id,
			sourceUrl,
			title,
			rent,
			address,
			contactName,
			description
		});

		let generatedMessage: string;
		try {
			generatedMessage = await generateCoverLetter({
				profile: {
					fullName: userProfile.fullName,
					occupation: userProfile.occupation,
					moveInEarliest: userProfile.moveInEarliest,
					householdSize: userProfile.householdSize,
					monthlyNetIncome: userProfile.monthlyNetIncome,
					aboutMe: userProfile.aboutMe
				},
				listing: { title, rent, address, description, contactName }
			});
		} catch {
			return fail(502, {
				message:
					'Die Nachricht konnte nicht generiert werden (Mistral-Fehler). Bitte später erneut versuchen.'
			});
		}

		let portrait: CoverPageData['portrait'] = null;
		if (coverTemplate !== 'none' && userProfile.portraitPath && userProfile.portraitMimeType) {
			portrait = {
				bytes: await readFile(userProfile.portraitPath),
				mimeType: userProfile.portraitMimeType
			};
		}

		const coverData: CoverPageData = {
			fullName: userProfile.fullName,
			wgTitle: title,
			wgAddress: address,
			street: userProfile.street,
			city: userProfile.city,
			phone: userProfile.phone,
			email: user.email,
			portrait
		};

		const pdfBuffer = await buildApplicationPdf(
			generatedMessage,
			docsToAttach.map((d) => ({ storagePath: d.storagePath, mimeType: d.mimeType })),
			coverTemplate,
			coverData
		);
		const applicationId = randomUUID();
		const pdfPath = await saveGeneratedFile(user.id, `bewerbung-${applicationId}.pdf`, pdfBuffer);

		await db.insert(application).values({
			id: applicationId,
			userId: user.id,
			listingId,
			generatedMessage,
			pdfPath,
			coverTemplate
		});

		if (docsToAttach.length > 0) {
			await db
				.insert(applicationDocument)
				.values(docsToAttach.map((d) => ({ applicationId, documentId: d.id })));
		}

		redirect(302, `/apply/${applicationId}`);
	}
};
