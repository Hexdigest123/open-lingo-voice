import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	// Fetch user's locale preference
	const [user] = await db
		.select({ locale: users.locale })
		.from(users)
		.where(eq(users.id, locals.user.id))
		.limit(1);

	return {
		user: locals.user,
		userLocale: user?.locale || null
	};
};
