-- Drop all existing tables first
DROP TABLE IF EXISTS `audit_log`;
--> statement-breakpoint
DROP TABLE IF EXISTS `payout_item`;
--> statement-breakpoint
DROP TABLE IF EXISTS `payout_batch`;
--> statement-breakpoint
DROP TABLE IF EXISTS `tip`;
--> statement-breakpoint
DROP TABLE IF EXISTS `staff_profile`;
--> statement-breakpoint
DROP TABLE IF EXISTS `branch`;
--> statement-breakpoint
DROP TABLE IF EXISTS `company_member`;
--> statement-breakpoint
DROP TABLE IF EXISTS `company`;
--> statement-breakpoint
DROP TABLE IF EXISTS `subscription_plan`;
--> statement-breakpoint
DROP TABLE IF EXISTS `todos`;
--> statement-breakpoint
DROP TABLE IF EXISTS `session`;
--> statement-breakpoint
DROP TABLE IF EXISTS `user`;
--> statement-breakpoint
-- ============================================
-- AUTHENTICATION
-- ============================================
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'STAFF' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade
);
--> statement-breakpoint
-- ============================================
-- COMPANY & MULTI-TENANCY
-- ============================================
CREATE TABLE `company` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`legal_name` text,
	`slug` text NOT NULL UNIQUE,
	`country` text NOT NULL,
	`currency` text NOT NULL,
	`subscription_plan` text DEFAULT 'BASIC' NOT NULL,
	`subscription_status` text DEFAULT 'TRIALING' NOT NULL,
	`payment_provider_customer_id` text,
	`payment_provider_subscription_id` text,
	`trial_ends_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_member` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company_id` text NOT NULL,
	`role` text DEFAULT 'STAFF' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE cascade
);
--> statement-breakpoint
-- ============================================
-- BRANCHES
-- ============================================
CREATE TABLE `branch` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`location` text,
	`slug` text NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE cascade
);
--> statement-breakpoint
-- ============================================
-- STAFF
-- ============================================
CREATE TABLE `staff_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`user_id` text,
	`display_name` text NOT NULL,
	`position` text,
	`avatar_url` text,
	`public_id` text NOT NULL UNIQUE,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branch`(`id`) ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE set null
);
--> statement-breakpoint
-- ============================================
-- TIPS
-- ============================================
CREATE TABLE `tip` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`staff_profile_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`payment_status` text DEFAULT 'PENDING' NOT NULL,
	`distribution_status` text DEFAULT 'PENDING' NOT NULL,
	`payment_provider` text DEFAULT 'STRIPE' NOT NULL,
	`payment_provider_transaction_id` text,
	`customer_note` text,
	`customer_rating` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branch`(`id`) ON DELETE cascade,
	FOREIGN KEY (`staff_profile_id`) REFERENCES `staff_profile`(`id`) ON DELETE cascade
);
--> statement-breakpoint
-- ============================================
-- PAYOUTS
-- ============================================
CREATE TABLE `payout_batch` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`branch_id` text,
	`processed_by_user_id` text NOT NULL,
	`payout_date` integer NOT NULL,
	`total_amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branch`(`id`) ON DELETE set null,
	FOREIGN KEY (`processed_by_user_id`) REFERENCES `user`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payout_item` (
	`id` text PRIMARY KEY NOT NULL,
	`payout_batch_id` text NOT NULL,
	`staff_profile_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`payout_batch_id`) REFERENCES `payout_batch`(`id`) ON DELETE cascade,
	FOREIGN KEY (`staff_profile_id`) REFERENCES `staff_profile`(`id`) ON DELETE cascade
);
--> statement-breakpoint
-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE `subscription_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`monthly_price_per_branch` integer NOT NULL,
	`features` text,
	`payment_provider_price_id` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text,
	`user_id` text,
	`action` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE set null
);
--> statement-breakpoint
-- ============================================
-- LEGACY (to be removed later)
-- ============================================
CREATE TABLE `todos` (
	`id` integer PRIMARY KEY NOT NULL,
	`todo` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);

