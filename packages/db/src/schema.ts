import { pgTable, text, integer, serial, pgEnum, timestamp } from 'drizzle-orm/pg-core';

export const branchEnum = pgEnum('branch', ['CSE', 'DSAI', 'ECE']);

export const verifiedUsers = pgTable('verified_users', {
    id: serial('id').primaryKey().notNull(),
    discordId: text('discord_id').notNull(),
    gradYear: integer('graduation_year').notNull(),
    branch: branchEnum('branch'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const verifyLinks = pgTable('verify_links', {
    id: serial('id').primaryKey().notNull(),
    creatorDiscordId: text('creator_discord_id').notNull(),
    secret: text('secret').notNull(),
    expiry: timestamp('expiry').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
