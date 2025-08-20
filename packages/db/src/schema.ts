// For some reason, import * as schema from '@nyx/db/schema'; fucks up typescript's solver
// and it cant resolve the schema types at all
// so all types that rely on the database schema collapse
// Weirdly enough manually importing each symbol fixes this

import { branchEnum, verifiedUsers, verifyLinks } from './schema/verify.sql';
import { account, session, user, verification } from './schema/auth.sql';

export default {
    branchEnum,
    verifiedUsers,
    verifyLinks,

    account,
    session,
    user,
    verification,
};
