import { db } from '$lib/server/db';
import { refreshTokens, users } from '$lib/server/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { hashPassword } from './password';
import {
	createAccessToken,
	createRefreshToken,
	verifyAccessToken,
	verifyRefreshToken,
	getRefreshTokenExpiry
} from './jwt';

export interface SessionUser {
	id: number;
	email: string;
	displayName: string;
}

export interface SessionTokens {
	accessToken: string;
	refreshToken: string;
}

export async function createSession(userId: number, email: string): Promise<SessionTokens> {
	const accessToken = await createAccessToken(userId, email);
	const refreshToken = await createRefreshToken(userId, email);

	// Hash the refresh token before storing
	const tokenHash = await hashPassword(refreshToken);
	const expiresAt = getRefreshTokenExpiry();

	// Store refresh token in database
	await db.insert(refreshTokens).values({
		userId,
		tokenHash,
		expiresAt
	});

	return { accessToken, refreshToken };
}

export async function validateAccessToken(token: string): Promise<SessionUser | null> {
	const payload = await verifyAccessToken(token);
	if (!payload) {
		return null;
	}

	// Fetch user from database to ensure they still exist and get latest data
	const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

	if (!user) {
		return null;
	}

	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName
	};
}

export async function refreshSession(refreshToken: string): Promise<SessionTokens | null> {
	const payload = await verifyRefreshToken(refreshToken);
	if (!payload) {
		return null;
	}

	// Get all valid refresh tokens for this user
	const tokens = await db
		.select()
		.from(refreshTokens)
		.where(and(eq(refreshTokens.userId, payload.userId), gt(refreshTokens.expiresAt, new Date())));

	if (tokens.length === 0) {
		return null;
	}

	// Verify user still exists
	const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

	if (!user) {
		return null;
	}

	// Delete all old refresh tokens for this user (token rotation)
	await db.delete(refreshTokens).where(eq(refreshTokens.userId, payload.userId));

	// Create new session
	return createSession(user.id, user.email);
}

export async function revokeSession(userId: number): Promise<void> {
	await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

export async function cleanupExpiredTokens(): Promise<void> {
	await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
}

export async function createUserWithSession(
	email: string,
	password: string,
	displayName: string
): Promise<{ user: SessionUser; tokens: SessionTokens; userId: number }> {
	const passwordHash = await hashPassword(password);

	// Create user
	const [user] = await db
		.insert(users)
		.values({
			email,
			passwordHash,
			displayName
		})
		.returning();

	// Create session
	const tokens = await createSession(user.id, user.email);

	return {
		user: {
			id: user.id,
			email: user.email,
			displayName: user.displayName
		},
		tokens,
		userId: user.id
	};
}
