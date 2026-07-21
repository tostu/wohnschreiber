import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { application, listing } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [row] = await db
		.select({
			id: application.id,
			generatedMessage: application.generatedMessage,
			createdAt: application.createdAt,
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
