import { pgTable, text, integer, serial, pgEnum, timestamp, index, char } from 'drizzle-orm/pg-core';

export const branchEnum = pgEnum('branch', ['CSE', 'DSAI', 'ECE']);

export const verifiedUsers = pgTable('verified_users', {
    id: serial('id').primaryKey().notNull(),
    discordId: text('discord_id').notNull().unique(),
    gradYear: integer('graduation_year').notNull(),
    branch: branchEnum('branch'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const verifyLinks = pgTable('verify_links', {
    id: serial('id').primaryKey().notNull(),
    creatorDiscordId: text('creator_discord_id').notNull(),
    secret: char('secret', { length: 32 }).notNull(),
    expiry: timestamp('expiry').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
    index('link_secret_index').on(table.secret),
    index('link_creator_id').on(table.creatorDiscordId),
]);
