import { pgTable, text, integer, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

// ============================================
// AUTHENTICATION
// ============================================

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role', { enum: ['ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN'] })
    .notNull()
    .default('STAFF'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

// ============================================
// COMPANY & MULTI-TENANCY
// ============================================

export const companies = pgTable('company', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  slug: text('slug').notNull().unique(),
  country: text('country').notNull(),
  currency: text('currency').notNull(),
  subscriptionPlan: text('subscription_plan', { enum: ['BASIC', 'PRO', 'ENTERPRISE'] })
    .notNull()
    .default('BASIC'),
  subscriptionStatus: text('subscription_status', {
    enum: ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'],
  })
    .notNull()
    .default('TRIALING'),
  paymentProviderCustomerId: text('payment_provider_customer_id'),
  paymentProviderSubscriptionId: text('payment_provider_subscription_id'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const companyMembers = pgTable('company_member', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] })
    .notNull()
    .default('STAFF'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// BRANCHES
// ============================================

export const branches = pgTable('branch', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  location: text('location'),
  slug: text('slug').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// STAFF
// ============================================

export const staffProfiles = pgTable('staff_profile', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  position: text('position'),
  avatarUrl: text('avatar_url'),
  publicId: text('public_id').notNull().unique(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// TIPS
// ============================================

export const tips = pgTable('tip', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  staffProfileId: text('staff_profile_id')
    .notNull()
    .references(() => staffProfiles.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  paymentStatus: text('payment_status', { enum: ['SUCCEEDED', 'PENDING', 'FAILED'] })
    .notNull()
    .default('PENDING'),
  distributionStatus: text('distribution_status', { enum: ['PENDING', 'PAID'] })
    .notNull()
    .default('PENDING'),
  paymentProvider: text('payment_provider', { enum: ['STRIPE', 'LOCAL_GATEWAY'] })
    .notNull()
    .default('STRIPE'),
  paymentProviderTransactionId: text('payment_provider_transaction_id'),
  customerNote: text('customer_note'),
  customerRating: integer('customer_rating'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// PAYOUTS
// ============================================

export const payoutBatches = pgTable('payout_batch', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  processedByUserId: text('processed_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  payoutDate: timestamp('payout_date', { withTimezone: true }).notNull(),
  totalAmount: integer('total_amount').notNull(),
  currency: text('currency').notNull(),
  status: text('status', { enum: ['PENDING', 'COMPLETED'] })
    .notNull()
    .default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payoutItems = pgTable('payout_item', {
  id: text('id').primaryKey(),
  payoutBatchId: text('payout_batch_id')
    .notNull()
    .references(() => payoutBatches.id, { onDelete: 'cascade' }),
  staffProfileId: text('staff_profile_id')
    .notNull()
    .references(() => staffProfiles.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// SUBSCRIPTIONS
// ============================================

export const subscriptionPlans = pgTable('subscription_plan', {
  id: text('id').primaryKey(),
  name: text('name', { enum: ['Basic', 'Pro', 'Enterprise'] }).notNull(),
  monthlyPricePerBranch: integer('monthly_price_per_branch').notNull(),
  features: text('features'),
  paymentProviderPriceId: text('payment_provider_price_id'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// AUDIT LOGS
// ============================================

export const auditLogs = pgTable('audit_log', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'set null' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});