import { Event } from "@/structures/event";

export default new Event("ready", (d) => async (client) => {
    d.logger.info(`Logged in as ${client.user?.tag}`);
});
