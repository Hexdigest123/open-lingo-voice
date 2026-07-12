import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const [user] = await db
		.select({
			email: users.email,
			displayName: users.displayName
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	return {
		profile: user
	};
};

export const actions: Actions = {
	updateLocale: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const data = await request.formData();
		const locale = data.get('locale')?.toString();

		if (!locale || (locale !== 'en' && locale !== 'de')) {
			return fail(400, { localeError: 'Invalid locale' });
		}

		try {
			await db
				.update(users)
				.set({
					locale,
					updatedAt: new Date()
				})
				.where(eq(users.id, userId));

			return { localeSuccess: true };
		} catch (error) {
			console.error('Failed to update locale:', error);
			return fail(500, { localeError: 'Failed to update locale' });
		}
	}
};
