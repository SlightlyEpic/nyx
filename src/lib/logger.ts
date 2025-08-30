import { Env } from '@/utils/env';
import { createLogger as createWinston, format, transports, config } from 'winston';

export function createLogger(env: Env) {
    const colorizer = format.colorize();

    const logger = createWinston({
        levels: config.npm.levels,
        level: env.LOG_LEVEL,
        format: format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm' }),
            format.simple(),
            format.printf((msg) =>
                colorizer.colorize(
                    msg.level,
                    `[${msg.timestamp}] [${msg.level}]: ${msg.message}`,
                ),
            ),
        ),
        transports: [new transports.Console()],
    });

    return logger;
}

