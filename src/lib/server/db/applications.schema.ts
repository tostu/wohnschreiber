import { pgTable, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { document } from './documents.schema';

export const listing = pgTable('listing', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	sourceUrl: text('source_url'),
	title: text('title').notNull(),
	rent: integer('rent'),
	address: text('address'),
	description: text('description').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const application = pgTable('application', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	listingId: text('listing_id')
		.notNull()
		.references(() => listing.id, { onDelete: 'cascade' }),
	generatedMessage: text('generated_message').notNull(),
	pdfPath: text('pdf_path').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const applicationDocument = pgTable(
	'application_document',
	{
		applicationId: text('application_id')
			.notNull()
			.references(() => application.id, { onDelete: 'cascade' }),
		documentId: text('document_id')
			.notNull()
			.references(() => document.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.applicationId, table.documentId] })]
);
