import type winston from 'winston'
import type { Bot } from '@/structures/client';
import type { getDB } from '@/lib/db';
import { Env } from '@/utils/env';
import type { EmailTransport } from '@/lib/nodemailer';
import type {
    ButtonInteraction,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    UserContextMenuCommandInteraction,
} from 'discord.js';

export type CommandDependencies = {
    client: Bot;
    db: ReturnType<typeof getDB>;
    env: Env;
    logger: winston.Logger;
    nodemailer: EmailTransport;
};

export interface SlashCommand {
    builder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    chatCommandHandler: (
        interaction: ChatInputCommandInteraction,
        d: CommandDependencies,
    ) => unknown;
    buttonHandler?: (
        interaction: ButtonInteraction,
        d: CommandDependencies,
    ) => unknown;
}

export interface UserContextMenuCommand {
    builder: ContextMenuCommandBuilder;
    userContextMenuHandler: (
        interaction: UserContextMenuCommandInteraction,
        d: CommandDependencies,
    ) => unknown;
}

export interface MessageContextMenuCommand {
    builder: ContextMenuCommandBuilder;
    messageContextMenuHandler: (
        interaction: MessageContextMenuCommandInteraction,
        d: CommandDependencies,
    ) => unknown;
}
