import type { Env } from '@/utils/env';
import nodemailer from 'nodemailer';

export type EmailTransport = ReturnType<typeof createNodemailer>;

export function createNodemailer(env: Env) {
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: env.NODEMAILER_EMAIL,
            pass: env.NODEMAILER_PASSWD,
        }
    });

    return transport;
}
