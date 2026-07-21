import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { saveDocument, deleteFile } from '$lib/server/storage';

const PORTRAIT_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

function clampOffset(value: FormDataEntryValue | null): number {
	const parsed = parseFloat(value?.toString() ?? '0');
	if (!Number.isFinite(parsed)) return 0;
	return Math.min(1, Math.max(-1, parsed));
}

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [existing] = await db.select().from(profile).where(eq(profile.userId, user.id));
	return { profile: existing ?? null };
};

export const actions: Actions = {
	save: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();

		const fullName = formData.get('fullName')?.toString().trim() ?? '';
		const occupation = formData.get('occupation')?.toString().trim() ?? '';
		const moveInEarliest = formData.get('moveInEarliest')?.toString() ?? '';
		const householdSize = parseInt(formData.get('householdSize')?.toString() ?? '1', 10);
		const monthlyNetIncomeRaw = formData.get('monthlyNetIncome')?.toString().trim();
		const monthlyNetIncome = monthlyNetIncomeRaw ? parseInt(monthlyNetIncomeRaw, 10) : null;
		const aboutMe = formData.get('aboutMe')?.toString().trim() || null;
		const street = formData.get('street')?.toString().trim() || null;
		const city = formData.get('city')?.toString().trim() || null;
		const phone = formData.get('phone')?.toString().trim() || null;
		const portraitOffsetX = clampOffset(formData.get('portraitOffsetX'));
		const portraitOffsetY = clampOffset(formData.get('portraitOffsetY'));

		if (!fullName || !occupation || !moveInEarliest) {
			return fail(400, { message: 'Name, Beruf und Einzugsdatum sind Pflichtfelder.' });
		}

		const [existing] = await db.select().from(profile).where(eq(profile.userId, user.id));

		let portraitPath = existing?.portraitPath ?? null;
		let portraitMimeType = existing?.portraitMimeType ?? null;

		const portraitFile = formData.get('portrait');
		if (portraitFile instanceof File && portraitFile.size > 0) {
			if (!PORTRAIT_MIME_TYPES.includes(portraitFile.type)) {
				return fail(400, { message: 'Portrait muss ein JPG oder PNG sein.' });
			}
			const saved = await saveDocument(user.id, 'portrait', portraitFile);
			if (existing?.portraitPath) await deleteFile(existing.portraitPath);
			portraitPath = saved.storagePath;
			portraitMimeType = saved.mimeType;
		}

		await db
			.insert(profile)
			.values({
				userId: user.id,
				fullName,
				occupation,
				moveInEarliest,
				householdSize: Number.isFinite(householdSize) ? householdSize : 1,
				monthlyNetIncome,
				aboutMe,
				street,
				city,
				phone,
				portraitPath,
				portraitMimeType,
				portraitOffsetX,
				portraitOffsetY
			})
			.onConflictDoUpdate({
				target: profile.userId,
				set: {
					fullName,
					occupation,
					moveInEarliest,
					householdSize,
					monthlyNetIncome,
					aboutMe,
					street,
					city,
					phone,
					portraitPath,
					portraitMimeType,
					portraitOffsetX,
					portraitOffsetY
				}
			});

		return { success: true };
	}
};
