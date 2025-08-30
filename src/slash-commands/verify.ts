import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { randomBytes } from 'crypto';
import { DateTime, Duration } from 'luxon';
import type { SlashCommand } from '@/types/command';
import { Result } from '@/utils/result';
import schema from '@/db/schema';

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
            .setName('college_email')
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

            const email = interaction.options.getString('college_email')!.toLowerCase();

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
            const yearShort = Number(yearShortStr);
            if(yearShort < 22 || yearShort > 25) {
                await interaction.editReply({
                    content: `Role for year '${yearShort + 4} not found. Please contact an admin to get one created.`
                });
                return;
            }
            const yearTagName = `Y_${yearShort + 4}`;   // Y_<grad year>

            const branchCode = match[1].toUpperCase() as 'BCS' | 'BDS' | 'BEC';
            const branchTagName = branchCode === 'BCS'
                    ? 'B_CSE'
                    : branchCode === 'BDS'
                        ? 'B_DSAI'
                        : 'B_ECE';

            // Check for already existing links
            const existingLink = (await Result
                .ofAsync(async () => db.query.verifyLinks.findFirst({
                    where: (vLinks, { eq, lt, and }) => and(
                        eq(vLinks.targetDiscordId, interaction.user.id),
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
                .ofAsync(() => db.transaction(async tx => {
                    const link = (await tx
                        .insert(schema.verifyLinks)
                        .values({
                            targetDiscordId: interaction.user.id,
                            // creatorBranch: branchTag,
                            // creatorGradYear: 2000 + Number(yearShortStr),
                            expiry: new Date(Date.now() + LINK_EXPIRY_MSEC),
                            secret: randomString32(),
                        })
                        .returning())[0];
                    
                    await tx
                        .insert(schema.linkTags)
                        .values([
                            { linkId: link.id, tagName: branchTagName },
                            { linkId: link.id, tagName: yearTagName },
                        ]);
                    
                    return link;
                }))
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
                content: `Successfully sent an verification email to \`${email}\`. Please check your inbox for an email from \`${env.NODEMAILER_EMAIL}\`.`,
            });
        } catch(_err: any) {
            logger.error(_err.message || _err)
            await interaction.editReply({
                content: 'An internal error occurred' + (_err.message ? `: ${_err.message}` : ''),
            })
        }
    },
} satisfies SlashCommand;
