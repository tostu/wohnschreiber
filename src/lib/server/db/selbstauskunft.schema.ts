import { pgTable, text, integer, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const selbstauskunft = pgTable('selbstauskunft', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	anrede: text('anrede').notNull(),
	birthDate: date('birth_date').notNull(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	street: text('street').notNull(),
	city: text('city').notNull(),
	phone: text('phone').notNull(),
	email: text('email').notNull(),
	occupationStatus: text('occupation_status').notNull(),
	jobTitle: text('job_title'),
	employer: text('employer'),
	annualIncome: integer('annual_income'),
	moveReason: text('move_reason').notNull(),
	commercialUse: text('commercial_use').notNull().default('keine_angabe'),
	pets: text('pets').notNull().default('keine_angabe'),
	smoker: text('smoker').notNull().default('keine_angabe'),
	guarantee: text('guarantee').notNull().default('keine_angabe'),
	wbs: text('wbs').notNull().default('keine_angabe'),
	liabilityInsurance: text('liability_insurance').notNull().default('keine_angabe'),
	affidavitOfAssets: text('affidavit_of_assets').notNull().default('keine_angabe'),
	insolvency: text('insolvency').notNull().default('keine_angabe'),
	confirmedTruthful: boolean('confirmed_truthful').notNull().default(false),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});
