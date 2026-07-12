import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createUserWithSession } from '$lib/server/auth/session';
import {
	isValidInputWithSpaces,
	isValidInput,
	isValidEmail,
	MAX_INPUT_LENGTH
} from '$lib/server/validation/input';

const REFRESH_COOKIE_NAME = 'refresh_token';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const displayName = data.get('displayName')?.toString().trim();
		const email = data.get('email')?.toString().toLowerCase().trim();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		// Validation
		if (!displayName || !email || !password || !confirmPassword) {
			return fail(400, { error: 'auth.errors.required', displayName, email });
		}

		if (displayName.length < 2 || displayName.length > 50) {
			return fail(400, { error: 'errors.displayNameLength', displayName, email });
		}

		if (!isValidInputWithSpaces(displayName)) {
			return fail(400, { error: 'errors.invalidCharacters', displayName, email });
		}

		if (!isValidEmail(email)) {
			return fail(400, { error: 'errors.invalidEmail', displayName, email });
		}

		if (!isValidInput(password)) {
			return fail(400, { error: 'errors.invalidCharacters', displayName, email });
		}

		if (password.length < 8) {
			return fail(400, { error: 'errors.passwordMinLength', displayName, email });
		}

		if (password.length > MAX_INPUT_LENGTH) {
			return fail(400, { error: 'errors.passwordMaxLength', displayName, email });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'auth.errors.passwordMismatch', displayName, email });
		}

		// Check if email already exists
		const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

		if (existingUser) {
			return fail(400, { error: 'auth.errors.emailExists', displayName, email });
		}

		let result;
		try {
			// Create user and session (open signup - always approved)
			result = await createUserWithSession(email, password, displayName);
		} catch (error) {
			console.error('Registration error:', error);
			return fail(500, { error: 'common.error', displayName, email });
		}

		// Set refresh token cookie (outside try/catch to avoid catching redirect)
		cookies.set(REFRESH_COOKIE_NAME, result.tokens.refreshToken, {
			path: '/',
			httpOnly: true,
			secure: !import.meta.env.DEV,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		// Redirect to chat
		redirect(303, '/chat');
	}
};
