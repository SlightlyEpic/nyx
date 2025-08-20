import type winston from 'winston';
import type { ClientEvents } from 'discord.js';
import type { getDB } from '@/utils/db';
import type { Bot } from './client';
import { Env } from '@/utils/env';

export type EventDependencies = {
    client: Bot;
    db: ReturnType<typeof getDB>;
    env: Env;
    logger: winston.Logger;
};

export class Event<Key extends keyof ClientEvents> {
    constructor(
        public name: Key,
        public handler: (
            d: EventDependencies,
        ) => (...args: ClientEvents[Key]) => unknown,
    ) {}
}
