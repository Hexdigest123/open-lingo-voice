import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { decryptApiKey } from '$lib/server/auth/encryption';

export interface ApiKeyResult {
	key: string | null;
	isGlobalKey: boolean;
}

/**
 * Get the effective OpenAI API key for a user with source information.
 * Priority: User's personal key > Global key from OPENAI_API_KEY env var
 * @param userId The user ID to get the API key for
 * @returns Object containing the decrypted API key and whether it's the global key
 */
export async function getEffectiveApiKeyWithSource(userId: number): Promise<ApiKeyResult> {
	// First, try to get the user's personal API key
	const [user] = await db
		.select({ openaiApiKeyEncrypted: users.openaiApiKeyEncrypted })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (user?.openaiApiKeyEncrypted) {
		try {
			const key = decryptApiKey(user.openaiApiKeyEncrypted);
			return { key, isGlobalKey: false };
		} catch (error) {
			console.error(`[Security] Failed to decrypt API key for user ${userId}:`, error);
			// Fall through to global key
		}
	}

	// Fall back to global API key from environment variable
	const globalKey = env.OPENAI_API_KEY;
	if (globalKey) {
		return { key: globalKey, isGlobalKey: true };
	}

	return { key: null, isGlobalKey: false };
}

/**
 * Get the effective OpenAI API key for a user.
 * Priority: User's personal key > Global key from OPENAI_API_KEY env var
 * @param userId The user ID to get the API key for
 * @returns The decrypted API key or null if none is available
 */
export async function getEffectiveApiKey(userId: number): Promise<string | null> {
	const result = await getEffectiveApiKeyWithSource(userId);
	return result.key;
}

/**
 * Check if a global API key is configured (via OPENAI_API_KEY env var).
 */
export function hasGlobalApiKey(): boolean {
	return !!env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 0;
}
