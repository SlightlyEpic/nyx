import { Bot } from "@/structures/client";
import { Env } from "./env";

export async function addRoles(env: Env, bot: Bot, userId: string, roleIds: string[]): Promise<void> {
    const guild = bot.guilds.cache.get(env.DEV_GUILD_ID)!;
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleIds);
}
