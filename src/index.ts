import 'dotenv/config';
import { GatewayIntentBits } from 'discord.js';
import { Bot } from './structures/client';
import { createLogger } from './lib/logger';
import { readEnv } from './utils/env';
import { getDB } from './lib/db';
import { createNodemailer } from './lib/nodemailer';
import { createWebServer } from './web/server';

const env = readEnv();
const logger = createLogger(env);
const db = getDB();
const nodemailer = createNodemailer(env);

export const client = new Bot(
    { env, db, logger, nodemailer },
    {
        intents: [
            GatewayIntentBits.Guilds,
        ],
    },
);

const webServer = createWebServer({
    bot: client,
    db,
    env,
    logger,
});

client.start();
webServer.listen(env.PORT, env.HOST, () => {
    logger.info(`Listening on ${env.HOST}:${env.PORT}`);
});
