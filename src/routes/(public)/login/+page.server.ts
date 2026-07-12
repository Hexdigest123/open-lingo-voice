import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession } from '$lib/server/auth/session';
import { isValidEmail, isValidInput, MAX_INPUT_LENGTH } from '$lib/server/validation/input';

const REFRESH_COOKIE_NAME = 'refresh_token';

/**
 * Validate redirect URL to prevent open redirects
 * Only allows relative paths within the same origin
 */
function isValidRedirect(redirectUrl: string | null): string | null {
	if (!redirectUrl) return null;

	if (!redirectUrl.startsWith('/')) return null;
	if (redirectUrl.startsWith('//')) return null;
	if (redirectUrl.includes(':')) return null;

	if (!/^\/[a-zA-Z0-9\-_]*(\?[a-zA-Z0-9\-_=&%]*)?$/.test(redirectUrl)) return null;

	return redirectUrl;
}

export const load: PageServerLoad = async ({ url }) => {
	const redirectParam = url.searchParams.get('redirect');
	const validatedRedirect = isValidRedirect(redirectParam);

	return {
		redirect: validatedRedirect
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().toLowerCase().trim();
		const password = data.get('password')?.toString();
		const redirectParam = data.get('redirect')?.toString() || url.searchParams.get('redirect');
		const validatedRedirect = isValidRedirect(redirectParam);

		if (!email || !password) {
			return fail(400, { error: 'auth.errors.required', email });
		}

		if (!isValidEmail(email)) {
			return fail(400, { error: 'errors.invalidEmail', email });
		}

		if (!isValidInput(password)) {
			return fail(400, { error: 'errors.invalidCharacters', email });
		}

		if (password.length < 8 || password.length > MAX_INPUT_LENGTH) {
			return fail(400, { error: 'auth.errors.invalidCredentials', email });
		}

		// Find user by email
		const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

		if (!user) {
			return fail(400, { error: 'auth.errors.invalidCredentials', email });
		}

		// Verify password
		const isValid = await verifyPassword(password, user.passwordHash);

		if (!isValid) {
			return fail(400, { error: 'auth.errors.invalidCredentials', email });
		}

		// Create session
		const tokens = await createSession(user.id, user.email);

		// Set refresh token cookie
		cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
			path: '/',
			httpOnly: true,
			secure: !import.meta.env.DEV,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		// Redirect to requested page or chat
		redirect(303, validatedRedirect || '/chat');
	}
};
