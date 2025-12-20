import { createClient, ResultSet } from '@libsql/client';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';

import {
  auditLogs,
  branches,
  companies,
  companyMembers,
  payoutBatches,
  payoutItems,
  sessions,
  staffProfiles,
  subscriptionPlans,
  tips,
  users,
} from './schema';

// Setup sqlite database connection
const client = createClient({
  url: process.env.DATABASE_URL ?? 'file:sqlite.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
export const db = drizzle(client, {
  schema: {
    users,
    sessions,
    companies,
    companyMembers,
    branches,
    staffProfiles,
    tips,
    payoutBatches,
    payoutItems,
    subscriptionPlans,
    auditLogs
  },
});

// Setup lucia adapter
export const luciaAdapter = new DrizzleSQLiteAdapter(db, sessions, users);

// Export Transaction type to be used in repositories
type Schema = {
  users: typeof users;
  sessions: typeof sessions;
  companies: typeof companies;
  companyMembers: typeof companyMembers;
  branches: typeof branches;
  staffProfiles: typeof staffProfiles;
  tips: typeof tips;
  payoutBatches: typeof payoutBatches;
  payoutItems: typeof payoutItems;
  subscriptionPlans: typeof subscriptionPlans;
  auditLogs: typeof auditLogs;
};
export type Transaction = SQLiteTransaction<
  'async',
  ResultSet,
  Schema,
  ExtractTablesWithRelations<Schema>
>;
