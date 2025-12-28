// ============================================
// CHANGED: Import from postgres-js instead of libsql
// ============================================
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';

import {
  accounts,
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
  verifications,
} from './schema';

// ============================================
// CHANGED: Setup PostgreSQL connection instead of SQLite
// ============================================
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client (replaces createClient from libsql)
export const client = postgres(connectionString, {
  prepare: false, // Required for Supabase connection pooling
});

// Create drizzle instance
export const db = drizzle(client, {
  schema: {
    users,
    sessions,
    accounts,
    verifications,
    companies,
    companyMembers,
    branches,
    staffProfiles,
    tips,
    payoutBatches,
    payoutItems,
    subscriptionPlans,
    auditLogs,
  },
});

// ============================================
// Export Transaction type for PostgreSQL
// ============================================
type Schema = {
  users: typeof users;
  sessions: typeof sessions;
  accounts: typeof accounts;
  verifications: typeof verifications;
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

export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;
