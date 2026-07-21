import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.signInEmail({
				body: { email, password }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Anmeldung fehlgeschlagen.', mode: 'signIn' });
			}
			return fail(500, { message: 'Unerwarteter Fehler.', mode: 'signIn' });
		}

		redirect(302, '/');
	},

	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';

		if (!name) {
			return fail(400, { message: 'Bitte gib deinen Namen an.', mode: 'signUp' });
		}

		try {
			await auth.api.signUpEmail({
				body: { email, password, name }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					message: error.message || 'Registrierung fehlgeschlagen.',
					mode: 'signUp'
				});
			}
			return fail(500, { message: 'Unerwarteter Fehler.', mode: 'signUp' });
		}

		redirect(302, '/');
	}
};
