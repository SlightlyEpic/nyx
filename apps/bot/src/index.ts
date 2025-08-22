import 'dotenv/config';
import { GatewayIntentBits } from 'discord.js';
import { Bot } from './structures/client';
import { logger } from './lib/logger';
import { readEnv } from './utils/env';
import { getDB } from './lib/db';
import { createNodemailer } from './lib/nodemailer';

const env = readEnv();
const db = getDB();
const nodemailer = createNodemailer(env);

export const client = new Bot(
    { env, db, logger, nodemailer },
    {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
        ],
    },
);

client.start();