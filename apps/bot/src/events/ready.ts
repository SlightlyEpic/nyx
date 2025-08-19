import { Event } from "@/structures/event";
import { logger } from "@/utils/logger";

export default new Event("ready", (d) => async (client) => {
    logger.info(`Logged in as ${client.user?.tag}`);
});
