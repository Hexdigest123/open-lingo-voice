import { json, type Handle } from '@sveltejs/kit';
import { validateAccessToken, refreshSession } from '$lib/server/auth/session';
import { checkRateLimit, RATE_LIMITS } from '$lib/server/security/rateLimit';

const REFRESH_COOKIE_NAME = 'refresh_token';

// Rate limited API paths and their configurations
const RATE_LIMITED_PATHS: Array<{ pattern: RegExp; config: keyof typeof RATE_LIMITS }> = [
	{ pattern: /^\/api\/chat\/completions/, config: 'chatCompletions' },
	{ pattern: /^\/api\/chat\/realtime-token/, config: 'realtimeToken' }
];

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	// Try to get access token from Authorization header
	const authHeader = event.request.headers.get('Authorization');
	let accessToken: string | null = null;

	if (authHeader?.startsWith('Bearer ')) {
		accessToken = authHeader.slice(7);
	}

	// Validate access token if present
	if (accessToken) {
		const user = await validateAccessToken(accessToken);
		if (user) {
			event.locals.user = user;
		}
	}

	// If no valid access token, try to refresh using cookie
	if (!event.locals.user) {
		const refreshToken = event.cookies.get(REFRESH_COOKIE_NAME);

		if (refreshToken) {
			const tokens = await refreshSession(refreshToken);

			if (tokens) {
				event.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
					path: '/',
					httpOnly: true,
					secure: !import.meta.env.DEV,
					sameSite: 'lax',
					maxAge: 60 * 60 * 24 * 7 // 7 days
				});

				const user = await validateAccessToken(tokens.accessToken);
				if (user) {
					event.locals.user = user;
					event.locals.newAccessToken = tokens.accessToken;
				}
			} else {
				event.cookies.delete(REFRESH_COOKIE_NAME, { path: '/' });
			}
		}
	}

	// Rate limiting for API endpoints
	const pathname = event.url.pathname;
	for (const { pattern, config } of RATE_LIMITED_PATHS) {
		if (pattern.test(pathname)) {
			const identifier =
				event.locals.user?.id?.toString() ||
				event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
				event.getClientAddress();

			const rateLimitConfig = RATE_LIMITS[config];
			const result = checkRateLimit(identifier, config, rateLimitConfig);

			if (!result.allowed) {
				return json(
					{
						error: 'Too many requests. Please try again later.',
						retryAfter: Math.ceil(result.resetIn / 1000)
					},
					{
						status: 429,
						headers: {
							'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
							'X-RateLimit-Limit': rateLimitConfig.limit.toString(),
							'X-RateLimit-Remaining': '0',
							'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString()
						}
					}
				);
			}
			break;
		}
	}

	const response = await resolve(event);

	if (event.locals.newAccessToken) {
		response.headers.set('X-New-Access-Token', event.locals.newAccessToken);
	}

	return response;
};
