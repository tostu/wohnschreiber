import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import { document, documentType } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { saveDocument, deleteFile } from '$lib/server/storage';
import { randomUUID } from 'node:crypto';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const docs = await db.select().from(document).where(eq(document.userId, user.id));
	return { documents: docs };
};

export const actions: Actions = {
	upload: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();
		const type = formData.get('type')?.toString() ?? '';
		const file = formData.get('file');

		if (!documentType.enumValues.includes(type as (typeof documentType.enumValues)[number])) {
			return fail(400, { message: 'Unbekannter Dokumenttyp.' });
		}
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'Bitte eine Datei auswählen.' });
		}

		const [existing] = await db
			.select()
			.from(document)
			.where(
				and(
					eq(document.userId, user.id),
					eq(document.type, type as (typeof documentType.enumValues)[number])
				)
			);

		const saved = await saveDocument(user.id, type, file);

		if (existing) {
			await deleteFile(existing.storagePath);
			await db
				.update(document)
				.set({
					fileName: saved.fileName,
					storagePath: saved.storagePath,
					mimeType: saved.mimeType,
					uploadedAt: new Date()
				})
				.where(eq(document.id, existing.id));
		} else {
			await db.insert(document).values({
				id: randomUUID(),
				userId: user.id,
				type: type as (typeof documentType.enumValues)[number],
				fileName: saved.fileName,
				storagePath: saved.storagePath,
				mimeType: saved.mimeType
			});
		}

		return { success: true };
	},

	delete: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';

		const [existing] = await db
			.select()
			.from(document)
			.where(and(eq(document.id, id), eq(document.userId, user.id)));

		if (existing) {
			await deleteFile(existing.storagePath);
			await db.delete(document).where(eq(document.id, id));
		}

		return { success: true };
	}
};
