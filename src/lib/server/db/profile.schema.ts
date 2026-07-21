import { pgTable, text, integer, date } from 'drizzle-orm/pg-core';
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
	aboutMe: text('about_me')
});
