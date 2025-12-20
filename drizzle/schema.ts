import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ============================================
// AUTHENTICATION
// ============================================

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role', { enum: ['ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN'] })
    .notNull()
    .default('STAFF'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
});

// ============================================
// COMPANY & MULTI-TENANCY
// ============================================

export const companies = sqliteTable('company', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  slug: text('slug').notNull().unique(), // For public URLs
  country: text('country').notNull(),
  currency: text('currency').notNull(), // ISO currency code
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
  trialEndsAt: integer('trial_ends_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const companyMembers = sqliteTable('company_member', {
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
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// BRANCHES
// ============================================

export const branches = sqliteTable('branch', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  location: text('location'),
  slug: text('slug').notNull(), // For public URLs (unique per company)
  timezone: text('timezone').notNull().default('UTC'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// STAFF
// ============================================

export const staffProfiles = sqliteTable('staff_profile', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Required - staff must have user account
  displayName: text('display_name').notNull(),
  position: text('position'),
  avatarUrl: text('avatar_url'),
  publicId: text('public_id').notNull().unique(), // For public QR codes
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// TIPS
// ============================================

export const tips = sqliteTable('tip', {
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
  amount: integer('amount').notNull(), // Amount in smallest currency unit (cents)
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
  customerRating: integer('customer_rating'), // 1-5
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// PAYOUTS
// ============================================

export const payoutBatches = sqliteTable('payout_batch', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'set null' }), // Nullable for company-wide
  processedByUserId: text('processed_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  payoutDate: integer('payout_date', { mode: 'timestamp' }).notNull(),
  totalAmount: integer('total_amount').notNull(),
  currency: text('currency').notNull(),
  status: text('status', { enum: ['PENDING', 'COMPLETED'] })
    .notNull()
    .default('PENDING'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const payoutItems = sqliteTable('payout_item', {
  id: text('id').primaryKey(),
  payoutBatchId: text('payout_batch_id')
    .notNull()
    .references(() => payoutBatches.id, { onDelete: 'cascade' }),
  staffProfileId: text('staff_profile_id')
    .notNull()
    .references(() => staffProfiles.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// SUBSCRIPTIONS
// ============================================

export const subscriptionPlans = sqliteTable('subscription_plan', {
  id: text('id').primaryKey(),
  name: text('name', { enum: ['Basic', 'Pro', 'Enterprise'] }).notNull(),
  monthlyPricePerBranch: integer('monthly_price_per_branch').notNull(), // In cents
  features: text('features', { mode: 'json' }), // JSON structure
  paymentProviderPriceId: text('payment_provider_price_id'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// AUDIT LOGS
// ============================================

export const auditLogs = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'set null' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  metadata: text('metadata', { mode: 'json' }), // JSON structure
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

