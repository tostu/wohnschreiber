/**
 * Applies pending Drizzle migrations, then exits. Run on container start before the
 * server boots so the production database schema is always up to date.
 *
 * Deliberately standalone: it depends only on drizzle-orm/postgres (available in the
 * runtime node_modules) and the generated SQL in ./drizzle, not on drizzle-kit or the
 * TypeScript schema. That keeps it runnable in the slim production image.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

// onnotice: silence the "already exists, skipping" NOTICEs the migrator emits on reruns.
const client = postgres(url, { max: 1, onnotice: () => {} });

try {
	await migrate(drizzle(client), { migrationsFolder: './drizzle' });
	console.log('Migrations applied.');
} finally {
	await client.end();
}
