import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDB } from '../db';

const db = getDB();

export const auth = betterAuth({
    plugins: [],
    database: drizzleAdapter(db, {
        provider: 'pg'
    }),
    emailAndPassword: {
        enabled: false
    },
    socialProviders: {
        // google: {
        //     clientId: process.env.GOOGLE_CLIENT_ID as string,
        //     clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        // }
        github: {
            clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID as string,
            clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET as string,
        }
    }
});
