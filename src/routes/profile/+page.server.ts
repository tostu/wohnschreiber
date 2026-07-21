import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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

		if (!fullName || !occupation || !moveInEarliest) {
			return fail(400, { message: 'Name, Beruf und Einzugsdatum sind Pflichtfelder.' });
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
				aboutMe
			})
			.onConflictDoUpdate({
				target: profile.userId,
				set: { fullName, occupation, moveInEarliest, householdSize, monthlyNetIncome, aboutMe }
			});

		return { success: true };
	}
};
