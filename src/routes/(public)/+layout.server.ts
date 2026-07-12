import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Redirect authenticated users to chat
	if (locals.user && url.pathname !== '/logout') {
		redirect(303, '/chat');
	}

	return {
		user: locals.user
	};
};
