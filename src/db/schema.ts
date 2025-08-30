// For some reason, import * as schema from '@nyx/db/schema'; fucks up typescript's solver
// and it cant resolve the schema types at all
// so all types that rely on the database schema collapse
// Weirdly enough manually importing each symbol fixes this

import {
    verifiedUsers, verifiedUsersRelations,
    verifyLinks, verifyLinksRelations,
    tags, tagsRelations,
    linkTags, linkTagsRelations,
    userTags, userTagsRelations,
} from './schema/verify.sql';

export default {
    verifiedUsers, verifiedUsersRelations,
    verifyLinks, verifyLinksRelations,
    tags, tagsRelations,
    linkTags, linkTagsRelations,
    userTags, userTagsRelations,
};
