import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function requireUser(event: RequestEvent) {
	if (!event.locals.user) {
		redirect(302, '/login');
	}
	return event.locals.user!;
}
