import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { application, listing, applicationStatusValues } from '$lib/server/db/schema';
import type { ApplicationStatus } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [row] = await db
		.select({
			id: application.id,
			generatedMessage: application.generatedMessage,
			createdAt: application.createdAt,
			status: application.status,
			listingTitle: listing.title
		})
		.from(application)
		.innerJoin(listing, eq(application.listingId, listing.id))
		.where(and(eq(application.id, event.params.id), eq(application.userId, user.id)));

	if (!row) {
		error(404, 'Bewerbung nicht gefunden.');
	}

	return { application: row };
};

export const actions: Actions = {
	updateStatus: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();
		const status = formData.get('status')?.toString() as ApplicationStatus | undefined;

		if (!status || !applicationStatusValues.includes(status)) {
			return fail(400, { message: 'Ungültiger Status.' });
		}

		await db
			.update(application)
			.set({ status })
			.where(and(eq(application.id, event.params.id), eq(application.userId, user.id)));
	},

	delete: async (event) => {
		const user = requireUser(event);
		await db
			.delete(application)
			.where(and(eq(application.id, event.params.id), eq(application.userId, user.id)));

		redirect(302, '/apply');
	}
};
