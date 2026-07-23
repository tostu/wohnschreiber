import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { application } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { readFile } from '$lib/server/storage';

export const GET: RequestHandler = async (event) => {
	const user = requireUser(event);
	const [row] = await db
		.select()
		.from(application)
		.where(and(eq(application.id, event.params.id), eq(application.userId, user.id)));

	if (!row || !row.pdfPath) {
		error(404, 'Bewerbung nicht gefunden.');
	}

	const bytes = await readFile(row.pdfPath);
	return new Response(new Uint8Array(bytes), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="bewerbung-${row.id}.pdf"`
		}
	});
};
