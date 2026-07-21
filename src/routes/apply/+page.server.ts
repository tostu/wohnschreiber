import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { application, listing } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const rows = await db
		.select({
			id: application.id,
			createdAt: application.createdAt,
			listingTitle: listing.title
		})
		.from(application)
		.innerJoin(listing, eq(application.listingId, listing.id))
		.where(eq(application.userId, user.id))
		.orderBy(desc(application.createdAt));

	return { applications: rows };
};
