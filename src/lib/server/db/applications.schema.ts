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
	contactName: text('contact_name'),
	description: text('description').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const applicationStatusValues = ['draft', 'contacted', 'rejected', 'accepted'] as const;
export type ApplicationStatus = (typeof applicationStatusValues)[number];

export const coverTemplateValues = ['none', 'classic-centered'] as const;
export type CoverTemplate = (typeof coverTemplateValues)[number];

export const coverFontValues = ['serif', 'sans', 'bitter'] as const;
export type CoverFont = (typeof coverFontValues)[number];

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
	status: text('status', { enum: applicationStatusValues }).notNull().default('draft'),
	coverTemplate: text('cover_template', { enum: coverTemplateValues }).notNull().default('none'),
	coverFont: text('cover_font', { enum: coverFontValues }).notNull().default('serif'),
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
