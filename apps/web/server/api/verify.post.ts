import { auth } from '~~/server/lib/auth';
import { getDB } from '~~/server/db';
import { Result } from '~~/server/util/result';
import schema from '@nyx/db/schema';
import { eq } from 'drizzle-orm';

const db = getDB();

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession(event);

    if(!session) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Not logged in',
        });
    }

    const query = getQuery(event);
    
    if(!query.magic || typeof query.magic !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid magic query parameter',
        });
    }

    try {
        const linkSecret = query.magic;
        const link = await Result
            .of(async () => await db.query.verifyLinks.findFirst({
                where: (vLinks, { eq, lt, and }) => and(
                    eq(vLinks.secret, linkSecret),
                    lt(vLinks.expiry, new Date()),
                )
            }))
            .withCatch(_err => _err)
            .expect('Database query error');
        
        if(!link) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid magic query parameter'
            });
        }

        const email = session.user.email;

        if(!email.endsWith('@iiitdwd.ac.in')) {
            throw createError({
                statusCode: 403,
                statusMessage: 'You need to log in using a student email from iiitdwd.ac.in',
            });
        }

        const match = email.match(/^(\d\d)(bcs|bds|bec)(\d\d\d)@iiitdwd\.ac\.in$/gi);
        if(!match) {
            throw createError({
                statusCode: 403,
                statusMessage: 'You need to log in using a student email from iiitdwd.ac.in',
            });
        }

        const yearShortStr = match[0];
        const branchStr = match[1].toUpperCase() as 'CSE' | 'DSAI' | 'ECE';

        await Result
            .of(() => db
                .transaction(async tx => {
                    // Update verification status
                    await tx
                        .insert(schema.verifiedUsers)
                        .values({
                            discordId: link.creatorDiscordId,
                            branch: branchStr,
                            gradYear: 2000 + Number(yearShortStr),
                        });
                    
                    // Delete magic link
                    await tx
                        .delete(schema.verifyLinks)
                        .where(eq(schema.verifyLinks.id, link.id));
                })
            )
            .withCatch(_err => _err)
            .expect('Database insert error');
        
        return {
            message: 'Verification successful'
        }
    } catch(_err: any) {
        throw createError({
            status: 500,
            statusMessage: _err.message ?? 'Internal server error',
        });
    }
})
