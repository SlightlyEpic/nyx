import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { randomBytes } from 'crypto';
import { DateTime, Duration } from 'luxon';
import type { SlashCommand } from '@/types/command';
import { Result } from '@/utils/result';
import schema from '@nyx/db/schema';

export function randomString32() {
    // 16 random bytes == 32 hex characters
    return randomBytes(16).toString('hex');
}

const LINK_EXPIRY_MSEC = 1000 * 60 * 10;    // 10 minutes
const LINK_EXPIRY_DURATION = Duration.fromMillis(LINK_EXPIRY_MSEC);

export default {
    builder: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your discord account with your college email. Your email/identity is NOT stored.')
        .addStringOption(opt => opt
            .setName('College Email')
            .setDescription('A verification email will be sent to your inbox')
            .setRequired(true)
        ),
    chatCommandHandler: async (interaction, { db, logger, env, nodemailer }) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        try {
            const isUserVerified = (await Result
                .ofAsync(async () => await db.query.verifiedUsers.findFirst({
                    where: (vUsers, { eq }) => eq(vUsers.discordId, interaction.user.id)
                }) !== undefined)
                .withCatch(_err => _err))
                .expect('Database query failure')
            
            if(isUserVerified) {
                await interaction.editReply({
                    content: 'Your account is already verified'
                });
                return;
            }

            const email = interaction.options.getString('College Email')!.toLowerCase();

            if(!email.endsWith('@iiitdwd.ac.in')) {
                await interaction.editReply({
                    content: 'You need to use a student email from iiitdwd.ac.in',
                });
                return;
            }

            const match = email.match(/^(\d\d)(bcs|bds|bec)(\d\d\d)@iiitdwd\.ac\.in$/gi);
            if(!match) {
                await interaction.editReply({
                    content: 'You need to use a student email from iiitdwd.ac.in',
                });
                return;
            }

            const yearShortStr = match[0];
            const branchCode = match[1].toUpperCase() as 'BCS' | 'BDS' | 'BEC';
            const branchStr: typeof schema.branchEnum.enumValues[number] = branchCode === 'BCS'
                    ? 'CSE'
                    : branchCode === 'BDS'
                        ? 'DSAI'
                        : 'ECE';

            // Check for already existing links
            const existingLink = (await Result
                .ofAsync(async () => db.query.verifyLinks.findFirst({
                    where: (vLinks, { eq, lt, and }) => and(
                        eq(vLinks.creatorDiscordId, interaction.user.id),
                        lt(vLinks.expiry, new Date()),
                    )
                }))
                .withCatch(_err => _err))
                .expect('Database query failure');
            
            if(existingLink) {
                const validForStr = DateTime.fromJSDate(existingLink.expiry).diffNow(['minutes', 'seconds']).toHuman();
                const linkExpiryHumanStr = LINK_EXPIRY_DURATION.toHuman({ listStyle: 'long' });
                await interaction.editReply({
                    content: `A link has already been sent within the last ${linkExpiryHumanStr}. Try again after ${validForStr})`,
                });
                return;
            }
            
            // Create a new link if one doesn't already exist
            const createdLink = (await Result
                .ofAsync(async () => (await db
                    .insert(schema.verifyLinks)
                    .values({
                        creatorDiscordId: interaction.user.id,
                        creatorBranch: branchStr,
                        creatorGradYear: 2000 + Number(yearShortStr),
                        expiry: new Date(Date.now() + LINK_EXPIRY_MSEC),
                        secret: randomString32(),
                    })
                    .returning())[0]
                )
                .withCatch(_err => _err))
                .expect('Database insert failure');
            
            // Send verification email
            const emailText = 
                `Verify your discord account with your college email by clicking the link below.\n\n` +
                `** If you did not trigger this verification process you can safely ignore this email **\n\n` +
                `Discord account: ${interaction.user.username} (${interaction.user.id})\n` +
                `Verification link: ${env.SITE_ORIGIN}/verify/${createdLink.secret}\n` +
                `The link is valid for ${LINK_EXPIRY_DURATION.toHuman({ listStyle: 'long' })}`;

            const emailResult = (await Result
                .ofAsync(() => nodemailer.sendMail({
                    from: env.NODEMAILER_EMAIL,
                    to: email,
                    subject: 'Nyx: Verify your discord account',
                    text: emailText,
                }))
                .withCatch(_err => _err))
                .expect('Failed to send email');

            await interaction.editReply({
                content: `Successfully sent an verification email to ${email}. Please check your inbox.`,
            });
        } catch(_err: any) {
            logger.error(_err.message || _err)
            await interaction.editReply({
                content: 'An internal error occurred' + (_err.message ? `: ${_err.message}` : ''),
            })
        }
    },
} satisfies SlashCommand;
