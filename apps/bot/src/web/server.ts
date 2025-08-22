import express from 'express';
import type { getDB } from '@/lib/db';
import { Env } from '@/utils/env';
import type winston from 'winston';
import type { Bot } from '@/structures/client';
import { Result } from '@/utils/result';
import schema from '@nyx/db/schema';
import { eq } from 'drizzle-orm';

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
                    )
                }))
                .withCatch(_err => _err))
                .expect('Database query error')
            
            if(!link) {
                res.status(400).send('Invalid secret');
                return;
            }

            const result = (await Result
                .ofAsync(() => d.db.transaction(async tx => {
                    await tx
                        .insert(schema.verifiedUsers)
                        .values({
                            discordId: link.creatorDiscordId,
                            branch: link.creatorBranch,
                            gradYear: link.creatorGradYear,
                            createdAt: now,
                        });
                    
                    await tx
                        .delete(schema.verifyLinks)
                        .where(eq(schema.verifyLinks.id, link.id));
                }))
                .withCatch(_err => _err))
                .expect('Database update error')
            
            res.send('Verification successful! Your server roles will be updated shortly.')

            // TODO: Modify roles
        } catch(_err: any) {
            d.logger.error(_err.message || _err)
            res.status(500).send('Internal server error' + (_err.message ? `: ${_err.message}` : ''));
        }
    });

    return app;
}