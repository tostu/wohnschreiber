import { env } from '$env/dynamic/private';
import { mkdir, readFile as fsReadFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const uploadDir = env.UPLOAD_DIR || './uploads';

export async function saveDocument(
	userId: string,
	type: string,
	file: File
): Promise<{ storagePath: string; mimeType: string; fileName: string }> {
	const dir = join(uploadDir, userId, type);
	await mkdir(dir, { recursive: true });

	const storagePath = join(dir, `${randomUUID()}-${file.name}`);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(storagePath, buffer);

	return { storagePath, mimeType: file.type, fileName: file.name };
}

export async function saveGeneratedFile(
	userId: string,
	fileName: string,
	buffer: Buffer | Uint8Array
): Promise<string> {
	const dir = join(uploadDir, userId, 'generated');
	await mkdir(dir, { recursive: true });
	const storagePath = join(dir, fileName);
	await writeFile(storagePath, buffer);
	return storagePath;
}

export async function readFile(storagePath: string): Promise<Buffer> {
	return fsReadFile(storagePath);
}

export async function deleteFile(storagePath: string): Promise<void> {
	await unlink(storagePath).catch(() => {});
}
