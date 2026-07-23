import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from '$lib/server/storage';

export const GET: RequestHandler = async (event) => {
	const user = requireUser(event);
	const [row] = await db.select().from(profile).where(eq(profile.userId, user.id));

	if (!row?.portraitPath || !row.portraitMimeType) {
		error(404, 'Kein Portrait hinterlegt.');
	}

	let bytes: Buffer;
	try {
		bytes = await readFile(row.portraitPath);
	} catch (err) {
		console.error(`portrait file missing for user ${user.id}: ${row.portraitPath}`, err);
		error(404, 'Portrait-Datei nicht gefunden.');
	}

	return new Response(new Uint8Array(bytes), {
		headers: {
			'Content-Type': row.portraitMimeType,
			'Cache-Control': 'private, no-cache'
		}
	});
};
