import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { application, listing, applicationStatusValues } from '$lib/server/db/schema';
import type { ApplicationStatus } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const rows = await db
		.select({
			id: application.id,
			createdAt: application.createdAt,
			status: application.status,
			listingTitle: listing.title,
			listingUrl: listing.sourceUrl
		})
		.from(application)
		.innerJoin(listing, eq(application.listingId, listing.id))
		.where(eq(application.userId, user.id))
		.orderBy(desc(application.createdAt));

	return { applications: rows };
};

export const actions: Actions = {
	updateStatus: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();
		const status = formData.get('status')?.toString() as ApplicationStatus | undefined;

		if (!id || !status || !applicationStatusValues.includes(status)) {
			return fail(400, { message: 'Ungültiger Status.' });
		}

		await db
			.update(application)
			.set({ status })
			.where(and(eq(application.id, id), eq(application.userId, user.id)));
	},

	delete: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { message: 'Bewerbung nicht gefunden.' });
		}

		await db
			.delete(application)
			.where(and(eq(application.id, id), eq(application.userId, user.id)));
	}
};
