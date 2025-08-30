import { relations } from 'drizzle-orm';
import { pgTable, text, integer, serial, timestamp, index, char } from 'drizzle-orm/pg-core';

export const verifiedUsers = pgTable('verified_users', {
    id: serial('id').primaryKey().notNull(),
    discordId: text('discord_id').notNull().unique(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
    index('verified_users_discord_id_index').on(table.discordId),
]);

export const verifiedUsersRelations = relations(verifiedUsers, ({ many }) => ({
    tags: many(userTags),
}));

export const verifyLinks = pgTable('verify_links', {
    id: serial('id').primaryKey().notNull(),
    targetDiscordId: text('target_discord_id').notNull(),
    secret: char('secret', { length: 32 }).notNull().unique(),
    expiry: timestamp('expiry', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
    index('verify_links_secret_index').on(table.secret),
    index('verify_links_creator_id_index').on(table.targetDiscordId),
]);

export const verifyLinksRelations = relations(verifyLinks, ({ many }) => ({
    tags: many(linkTags),
}));

export const tags = pgTable('tags', {
    name: char('name', { length: 32 }).primaryKey(),
    roleId: text('role_id').notNull(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
    userJoins: many(userTags),
    linkJoins: many(linkTags),
}));


export const linkTags = pgTable('linkTags', {
    linkId: integer('link_id').notNull().references(() => verifyLinks.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tagName: char('tag_name', { length: 32 }).notNull().references(() => tags.name, { onDelete: 'cascade', onUpdate: 'cascade' }),
});

export const linkTagsRelations = relations(linkTags, ({ one }) => ({
    link: one(verifyLinks, {
        fields: [linkTags.linkId],
        references: [verifyLinks.id],
    }),
    tag: one(tags, {
        fields: [linkTags.tagName],
        references: [tags.name],
    }),
}));

export const userTags = pgTable('user_tags', {
    userId: integer('user_id').notNull().references(() => verifiedUsers.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tagName: char('tag_name', { length: 32 }).notNull().references(() => tags.name, { onDelete: 'cascade', onUpdate: 'cascade' }),
});

export const userTagsRelations = relations(userTags, ({ one }) => ({
    user: one(verifiedUsers, {
        fields: [userTags.userId],
        references: [verifiedUsers.id],
    }),
    tag: one(tags, {
        fields: [userTags.tagName],
        references: [tags.name],
    }),
}));
