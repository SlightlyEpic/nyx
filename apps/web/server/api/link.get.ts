import { getDB } from '../db';
import { omit } from '~~/server/util/misc';
import { Result } from '~~/server/util/result';

const db = getDB();

export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    if(!query.magic || typeof query.magic !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid magic query parameter',
        });
    }

    const linkSecret = query.magic;
    const link = await Result
        .of(async () => await db.query.verifyLinks.findFirst({
            where: (vLinks, { eq }) => eq(vLinks.secret, linkSecret)
        }))
        .withCatch(_err => _err)
        .expect('Database query error');
    
    if(!link) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid magic query parameter'
        });
    }

    return omit(link, ['id']);
})
