import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Landing page is disabled; send visitors straight to login
	redirect(303, '/login');
};
