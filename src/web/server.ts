import express from 'express';
import type { getDB } from '@/lib/db';
import { Env } from '@/utils/env';
import type winston from 'winston';
import type { Bot } from '@/structures/client';
import { Result } from '@/utils/result';
import schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { addRoles } from '@/utils/bot';

export type WebServerDeps = {
    env: Env,
    db: ReturnType<typeof getDB>,
    logger: winston.Logger,
    bot: Bot
}

export function createWebServer(d: WebServerDeps): express.Express {
    const app = express();

    app.get('/verify/:secret', async (req, res) => {
        const secret = req.params.secret;

        if(secret.length !== 32 || !/^[a-f0-9]{32}$/.test(secret)) {
            res.status(400).send('Invalid secret');
            return;
        }

        try {
            const now = new Date();
            const link = (await Result
                .ofAsync(() => d.db.query.verifyLinks.findFirst({
                    where: (vLinks, { eq, and, lt }) => and(
                        eq(vLinks.secret, secret),
                        lt(vLinks.expiry, now),
                    ),
                    with: {
                        tags: {
                            with: {
                                tag: {
                                    columns: {
                                        roleId: true,
                                        name: false,
                                    }
                                }
                            }
                        }
                    },
                }))
                .withCatch(_err => _err))
                .expect('Database query error')
            
            if(!link) {
                res.status(400).send('Invalid secret');
                return;
            }

            const user = (await Result
                .ofAsync(() => d.db.transaction(async tx => {
                    const user = (await tx
                        .insert(schema.verifiedUsers)
                        .values({
                            discordId: link.targetDiscordId,
                            createdAt: now,
                        })
                        .returning())[0];
                    
                    await tx
                        .insert(schema.userTags)
                        .values(link.tags.map(tag => ({
                            userId: user.id,
                            tagName: tag.tagName,
                        })));
                    
                    await tx
                        .delete(schema.verifyLinks)
                        .where(eq(schema.verifyLinks.id, link.id));
                    
                    return user;
                }))
                .withCatch(_err => _err))
                .expect('Database update error')
            
            res.send('Verification successful! Your server roles will be updated shortly.')

            // Can silently fail
            addRoles(d.env, d.bot, user.discordId, link.tags.map(tag => tag.tag.roleId));
        } catch(_err: any) {
            d.logger.error(_err.message || _err)
            res.status(500).send('Internal server error' + (_err.message ? `: ${_err.message}` : ''));
        }
    });

    return app;
}