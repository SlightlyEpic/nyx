import { z } from 'zod';

const envSchema = z.object({
    HOST: z.string().min(1),
    PORT: z.coerce.number().positive(),

    DISCORD_TOKEN: z.string().min(1),
    DEV_GUILD_ID: z.string().min(1),
    SITE_ORIGIN: z.string().min(1),
    
    POSTGRES_HOST: z.string().min(1),
    POSTGRES_PORT: z.string().min(1),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DATABASE: z.string().min(1),

    NODEMAILER_EMAIL: z.string().min(1),
    NODEMAILER_PASSWD: z.string().min(1),

    LOG_LEVEL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function readEnv(): Env {
    const maybeEnv: Partial<z.input<typeof envSchema>> = {
        HOST: process.env.HOST,
        PORT: process.env.PORT,
        DISCORD_TOKEN: process.env.DISCORD_TOKEN,
        DEV_GUILD_ID: process.env.DEV_GUILD_ID,
        SITE_ORIGIN: process.env.SITE_ORIGIN,
        POSTGRES_HOST: process.env.POSTGRES_HOST,
        POSTGRES_PORT: process.env.POSTGRES_PORT,
        POSTGRES_USER: process.env.POSTGRES_USER,
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
        POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
        NODEMAILER_EMAIL: process.env.NODEMAILER_EMAIL,
        NODEMAILER_PASSWD: process.env.NODEMAILER_PASSWD,
        LOG_LEVEL: process.env.LOG_LEVEL,
    };

    const parseResult = envSchema.safeParse(maybeEnv);
    if (!parseResult.success) {
        throw new Error('Invalid environment variables', {
            cause: parseResult.error,
        });
    }

    return parseResult.data;
}
