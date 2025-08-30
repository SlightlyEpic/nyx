import type winston from 'winston';
import type { ClientEvents } from 'discord.js';
import type { getDB } from '@/lib/db';
import type { Bot } from './client';
import type { EmailTransport } from '@/lib/nodemailer';
import type { Env } from '@/utils/env';

export type EventDependencies = {
    client: Bot;
    db: ReturnType<typeof getDB>;
    env: Env;
    logger: winston.Logger;
    nodemailer: EmailTransport;
};

export class Event<Key extends keyof ClientEvents> {
    constructor(
        public name: Key,
        public handler: (
            d: EventDependencies,
        ) => (...args: ClientEvents[Key]) => unknown,
    ) {}
}
