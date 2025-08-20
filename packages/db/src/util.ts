import { type PostgresError } from 'postgres';

// Example error:
// {
//     "name": "PostgresError",
//     "severity_local": "ERROR",
//     "severity": "ERROR",
//     "code": "23505",
//     "detail": "Key (email)=(abcd@gmail.com) already exists.",
//     "schema_name": "public",
//     "table_name": "users",
//     "constraint_name": "users_email_unique",
//     "file": "nbtinsert.c",
//     "line": "664",
//     "routine": "_bt_check_unique"
// }

// https://www.postgresql.org/docs/current/errcodes-appendix.html
export const isFKeyViolation = (err: PostgresError) => err.code === '23503';
export const isUniqueViolation = (err: PostgresError) => err.code === '23505';
export const isCheckViolation = (err: PostgresError) => err.code === '23514';