ALTER TABLE "branch" DROP COLUMN "timezone";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "payout_batch" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "payout_item" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "tip" DROP COLUMN "currency";