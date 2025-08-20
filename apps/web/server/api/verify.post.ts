import { auth } from '~~/server/lib/auth';

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession(event);

    if(!session) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Not logged in',
        });
    }

    // TODO
})
