import type winston from 'winston';
import events from '@/events';
import slashCommands from '@/slash-commands';
import type {
    MessageContextMenuCommand,
    SlashCommand,
    UserContextMenuCommand,
} from '@/types/command';
// import { sendHook } from "@/utils/functions";
import { logger } from '@/lib/logger';
import type { Env } from '@/utils/env';
import type { getDB } from '@/lib/db';
import type { EmailTransport } from '@/lib/nodemailer';
import {
    type ApplicationCommandDataResolvable,
    Client,
    type ClientOptions,
    Collection,
} from 'discord.js';
import type { EventDependencies } from './event';

export type BotConfig = {
    env: Env;
    db: ReturnType<typeof getDB>;
    logger: winston.Logger;
    nodemailer: EmailTransport;
};

export class Bot extends Client {
    slashCommands = new Collection<string, SlashCommand>();
    userContextMenuCommands = new Collection<string, UserContextMenuCommand>();
    messageContextMenuCommands = new Collection<string, MessageContextMenuCommand>();

    constructor(
        public config: BotConfig,
        clientOptions: ClientOptions,
    ) {
        super(clientOptions);
    }

    async start() {
        await this.registerCommands();
        await this.registerEvents();
        this.login(this.config.env.DISCORD_TOKEN);
    }

    async registerCommands() {
        const slashCommandsData: ApplicationCommandDataResolvable[] = [];

        slashCommands.forEach((command) => {
            logger.info(`Loaded command ${command.builder.name} ✅`);
            this.slashCommands.set(command.builder.name, command);
            slashCommandsData.push(command.builder.toJSON());
        });

        this.once('ready', async () => {
            const guildId = this.config.env.DEV_GUILD_ID;

            logger.info('Loading application (/) commands.');

            // ? Dont you need to register the commands with discord
            if (guildId) {
                logger.info(`Setting slash commands in ${guildId}`);
                this.guilds.cache.get(guildId)?.commands.set(slashCommandsData);
            } else {
                logger.error('Put a valid DEV_GUILD_ID in .env');
                process.exit();
            }

            logger.info('Finished loading application (/) commands.');
        });
    }

    async registerEvents() {
        const evtDeps: EventDependencies = {
            client: this,
            db: this.config.db,
            env: this.config.env,
            logger: this.config.logger,
            nodemailer: this.config.nodemailer,
        };
        events.forEach((evt) => {
            // @ts-ignore TS is dumb and cant prove that this is correct
            this.on(evt.name, evt.handler(evtDeps));
        });
    }
}
