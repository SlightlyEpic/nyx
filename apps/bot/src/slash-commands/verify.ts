import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { randomBytes } from 'crypto';
import { DateTime } from 'luxon';
import type { SlashCommand } from '@/types/command';
import { Result } from '@/utils/result';
import { verifyLinks } from '@nyx/db/schema';

export function randomString32() {
    // 16 random bytes == 32 hex characters
    return randomBytes(16).toString('hex');
}

const LINK_EXPIRY_DURATION = 1000 * 60 * 10;    // 10 minutes

export default {
    builder: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your discord account with your college email'),
    chatCommandHandler: async (interaction, { db, env, logger }) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        try {
            const isUserVerified = await Result
                .of(async () => await db.query.verifiedUsers.findFirst({
                    where: (vUsers, { eq }) => eq(vUsers.discordId, interaction.user.id)
                }) !== undefined)
                .withCatch(_err => _err)
                .expect('Database query failure')
            
            if(isUserVerified) {
                await interaction.editReply({
                    content: 'Your account is already verified'
                });
                return;
            }

            // Check for already existing links
            const existingLink = await Result
                .of(async () => db.query.verifyLinks.findFirst({
                    where: (vLinks, { eq, lt, and }) => and(
                        eq(vLinks.creatorDiscordId, interaction.user.id),
                        lt(vLinks.expiry, new Date()),
                    )
                }))
                .withCatch(_err => _err)
                .expect('Database query failure');
            
            if(existingLink) {
                const validForStr = DateTime.fromJSDate(existingLink.expiry).diffNow(['minutes', 'seconds']).toHuman();
                await interaction.editReply({
                    content: `Verify link: ${env.SITE_ORIGIN}/verify?magic=${existingLink.secret} (Valid for ${validForStr})`,
                });
                return;
            }
            
            // Create a new link if one doesn't already exist
            const createdLink = await Result
                .of(async () => (await db
                    .insert(verifyLinks)
                    .values({
                        creatorDiscordId: interaction.user.id,
                        creatorUsername: interaction.user.username,
                        creatorImageUrl: interaction.user.avatarURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png',
                        expiry: new Date(Date.now() + LINK_EXPIRY_DURATION),
                        secret: randomString32(),
                    })
                    .returning())[0]
                )
                .withCatch(_err => _err)
                .expect('Database insert failure');
            
            const validForStr = DateTime.fromJSDate(createdLink.expiry).diffNow(['minutes', 'seconds']).toHuman();
            await interaction.editReply({
                content: `Verify link: ${env.SITE_ORIGIN}/verify?magic=${createdLink.secret} (Valid for ${validForStr})`,
            });
        } catch(_err: any) {
            logger.error(_err.message || _err)
            await interaction.editReply({
                content: 'An internal error occurred' + (_err.message ? `: ${_err.message}` : ''),
            })
        }
    },
} satisfies SlashCommand;
