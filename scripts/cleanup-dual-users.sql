-- Script to clean up users who are both company members and staff members
-- This enforces the strict separation between staff users and company users

-- Step 1: Find users who are both company members and staff members
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    COUNT(DISTINCT cm.id) as company_member_count,
    COUNT(DISTINCT sp.id) as staff_profile_count
FROM user u
INNER JOIN company_member cm ON cm.user_id = u.id
INNER JOIN staff_profile sp ON sp.user_id = u.id
GROUP BY u.id, u.email, u.name;

-- Step 2: Delete staff profiles from company members (recommended)
-- Company members cannot have staff profiles - they manage staff, not be staff
-- This enforces the strict separation between company users and staff users
DELETE FROM staff_profile 
WHERE user_id IN (
    SELECT DISTINCT u.id
    FROM user u
    INNER JOIN company_member cm ON cm.user_id = u.id
    WHERE EXISTS (SELECT 1 FROM staff_profile sp WHERE sp.user_id = u.id)
);

-- Step 3: Verify cleanup
-- This query should return 0 rows after cleanup
SELECT 
    u.id as user_id,
    u.email,
    u.name
FROM user u
WHERE EXISTS (SELECT 1 FROM company_member cm WHERE cm.user_id = u.id)
  AND EXISTS (SELECT 1 FROM staff_profile sp WHERE sp.user_id = u.id);

