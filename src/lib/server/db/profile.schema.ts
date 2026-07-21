import { pgTable, text, integer, date, doublePrecision } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const profile = pgTable('profile', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	fullName: text('full_name').notNull(),
	occupation: text('occupation').notNull(),
	moveInEarliest: date('move_in_earliest').notNull(),
	householdSize: integer('household_size').notNull().default(1),
	monthlyNetIncome: integer('monthly_net_income'),
	aboutMe: text('about_me'),
	street: text('street'),
	city: text('city'),
	phone: text('phone'),
	portraitPath: text('portrait_path'),
	portraitMimeType: text('portrait_mime_type'),
	// Fractional crop offset within [-1, 1], 0 = centered. Lets the user re-frame a
	// portrait whose face isn't centered before it's cropped into the cover page circle.
	portraitOffsetX: doublePrecision('portrait_offset_x').notNull().default(0),
	portraitOffsetY: doublePrecision('portrait_offset_y').notNull().default(0)
});
