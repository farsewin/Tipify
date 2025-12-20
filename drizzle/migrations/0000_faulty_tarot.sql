CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text,
	"user_id" text,
	"action" text NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"slug" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"slug" text NOT NULL,
	"country" text NOT NULL,
	"currency" text NOT NULL,
	"subscription_plan" text DEFAULT 'BASIC' NOT NULL,
	"subscription_status" text DEFAULT 'TRIALING' NOT NULL,
	"payment_provider_customer_id" text,
	"payment_provider_subscription_id" text,
	"trial_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_member" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_id" text NOT NULL,
	"role" text DEFAULT 'STAFF' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_batch" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"processed_by_user_id" text NOT NULL,
	"payout_date" timestamp with time zone NOT NULL,
	"total_amount" integer NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_item" (
	"id" text PRIMARY KEY NOT NULL,
	"payout_batch_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"position" text,
	"avatar_url" text,
	"public_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_profile_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"monthly_price_per_branch" integer NOT NULL,
	"features" text,
	"payment_provider_price_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tip" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"payment_status" text DEFAULT 'PENDING' NOT NULL,
	"distribution_status" text DEFAULT 'PENDING' NOT NULL,
	"payment_provider" text DEFAULT 'STRIPE' NOT NULL,
	"payment_provider_transaction_id" text,
	"customer_note" text,
	"customer_rating" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'STAFF' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch" ADD CONSTRAINT "branch_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_member" ADD CONSTRAINT "company_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_member" ADD CONSTRAINT "company_member_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batch" ADD CONSTRAINT "payout_batch_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batch" ADD CONSTRAINT "payout_batch_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batch" ADD CONSTRAINT "payout_batch_processed_by_user_id_user_id_fk" FOREIGN KEY ("processed_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_item" ADD CONSTRAINT "payout_item_payout_batch_id_payout_batch_id_fk" FOREIGN KEY ("payout_batch_id") REFERENCES "public"."payout_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_item" ADD CONSTRAINT "payout_item_staff_profile_id_staff_profile_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tip" ADD CONSTRAINT "tip_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tip" ADD CONSTRAINT "tip_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tip" ADD CONSTRAINT "tip_staff_profile_id_staff_profile_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profile"("id") ON DELETE cascade ON UPDATE no action;