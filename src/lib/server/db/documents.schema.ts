import { pgTable, text, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const documentType = pgEnum('document_type', [
	'selbstauskunft',
	'bonitaetsnachweis',
	'einkommensnachweis',
	'buergschaft',
	'personalausweis',
	'immatrikulationsbescheinigung',
	'lohnnachweis'
]);

export const document = pgTable(
	'document',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		type: documentType('type').notNull(),
		fileName: text('file_name').notNull(),
		storagePath: text('storage_path').notNull(),
		mimeType: text('mime_type').notNull(),
		uploadedAt: timestamp('uploaded_at').defaultNow().notNull()
	},
	(table) => [uniqueIndex('document_user_type_idx').on(table.userId, table.type)]
);

export const REQUIRED_DOCUMENT_TYPES = [
	'selbstauskunft',
	'bonitaetsnachweis',
	'personalausweis'
] as const;

export const OPTIONAL_DOCUMENT_TYPES = [
	'einkommensnachweis',
	'buergschaft',
	'immatrikulationsbescheinigung',
	'lohnnachweis'
] as const;
