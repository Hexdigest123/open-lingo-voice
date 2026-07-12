import {
	pgTable,
	pgEnum,
	serial,
	varchar,
	text,
	integer,
	timestamp,
	uuid,
	index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		email: varchar('email', { length: 255 }).notNull().unique(),
		passwordHash: varchar('password_hash', { length: 255 }).notNull(),
		displayName: varchar('display_name', { length: 100 }).notNull(),
		openaiApiKeyEncrypted: text('openai_api_key_encrypted'),
		locale: varchar('locale', { length: 10 }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [index('users_email_idx').on(table.email)]
);

// Refresh tokens table
export const refreshTokens = pgTable(
	'refresh_tokens',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		tokenHash: varchar('token_hash', { length: 255 }).notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('refresh_tokens_user_id_idx').on(table.userId),
		index('refresh_tokens_expires_at_idx').on(table.expiresAt)
	]
);

// Chat enums
export const chatModeEnum = pgEnum('chat_mode', ['voice', 'text']);
export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant', 'system']);

// Chat sessions table
export const chatSessions = pgTable(
	'chat_sessions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: integer('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		title: varchar('title', { length: 200 }),
		mode: chatModeEnum('mode').default('text').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [index('chat_sessions_user_id_idx').on(table.userId)]
);

// Chat messages table
export const chatMessages = pgTable(
	'chat_messages',
	{
		id: serial('id').primaryKey(),
		sessionId: uuid('session_id')
			.references(() => chatSessions.id, { onDelete: 'cascade' })
			.notNull(),
		role: chatRoleEnum('role').notNull(),
		content: text('content').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [index('chat_messages_session_id_idx').on(table.sessionId)]
);

// API usage type enum
export const apiUsageTypeEnum = pgEnum('api_usage_type', ['chat', 'voice']);

// API usage logs table (for auditing global key usage)
export const apiUsageLogs = pgTable(
	'api_usage_logs',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		usageType: apiUsageTypeEnum('usage_type').notNull(),
		sessionId: uuid('session_id').references(() => chatSessions.id, { onDelete: 'set null' }),
		promptTokens: integer('prompt_tokens').default(0).notNull(),
		completionTokens: integer('completion_tokens').default(0).notNull(),
		totalTokens: integer('total_tokens').default(0).notNull(),
		model: varchar('model', { length: 100 }),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('api_usage_logs_user_id_idx').on(table.userId),
		index('api_usage_logs_created_at_idx').on(table.createdAt)
	]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	refreshTokens: many(refreshTokens),
	chatSessions: many(chatSessions),
	apiUsageLogs: many(apiUsageLogs)
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	})
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
	user: one(users, {
		fields: [chatSessions.userId],
		references: [users.id]
	}),
	messages: many(chatMessages)
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	session: one(chatSessions, {
		fields: [chatMessages.sessionId],
		references: [chatSessions.id]
	})
}));

export const apiUsageLogsRelations = relations(apiUsageLogs, ({ one }) => ({
	user: one(users, {
		fields: [apiUsageLogs.userId],
		references: [users.id]
	}),
	session: one(chatSessions, {
		fields: [apiUsageLogs.sessionId],
		references: [chatSessions.id]
	})
}));

// Type exports for use throughout the app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
