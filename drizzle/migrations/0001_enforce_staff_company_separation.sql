DELETE FROM `staff_profile`
WHERE `user_id` IN (
    SELECT DISTINCT `cm`.`user_id`
    FROM `company_member` `cm`
    WHERE EXISTS (
        SELECT 1 FROM `staff_profile` `sp`
        WHERE `sp`.`user_id` = `cm`.`user_id`
    )
);
--> statement-breakpoint
DELETE FROM `staff_profile` WHERE `user_id` IS NULL;
--> statement-breakpoint
CREATE TABLE `staff_profile_new` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`position` text,
	`avatar_url` text,
	`public_id` text NOT NULL UNIQUE,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branch`(`id`) ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `staff_profile_new` (`id`, `company_id`, `branch_id`, `user_id`, `display_name`, `position`, `avatar_url`, `public_id`, `active`, `created_at`, `updated_at`)
SELECT `id`, `company_id`, `branch_id`, `user_id`, `display_name`, `position`, `avatar_url`, `public_id`, `active`, `created_at`, `updated_at`
FROM `staff_profile`
WHERE `user_id` IS NOT NULL;
--> statement-breakpoint
DROP TABLE `staff_profile`;
--> statement-breakpoint
ALTER TABLE `staff_profile_new` RENAME TO `staff_profile`;

