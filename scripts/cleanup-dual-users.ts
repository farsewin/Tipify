/**
 * Script to clean up users who are both company members and staff members
 * 
 * This script enforces strict separation by unlinking staff profiles from users
 * who are already company members. The staff profiles are kept (for QR codes)
 * but the userId is set to NULL so they can't access the staff dashboard.
 * 
 * Run with: npx tsx scripts/cleanup-dual-users.ts
 */

import { db } from '../drizzle';
import { users, companyMembers, staffProfiles } from '../drizzle/schema';
import { eq, and, exists, sql } from 'drizzle-orm';

async function cleanupDualUsers() {
  console.log('🔍 Finding users who are both company members and staff members...\n');

  // Get all company members
  const allCompanyMembers = await db.select().from(companyMembers);
  const companyMemberUserIds = new Set(allCompanyMembers.map((cm) => cm.userId));

  // Get all staff profiles with userId
  const allStaffProfiles = await db
    .select()
    .from(staffProfiles)
    .where(sql`${staffProfiles.userId} IS NOT NULL`);

  // Find staff profiles that belong to company members
  const conflictingStaffProfiles = allStaffProfiles.filter((sp) =>
    sp.userId && companyMemberUserIds.has(sp.userId)
  );

  if (conflictingStaffProfiles.length === 0) {
    console.log('✅ No inconsistent data found. All users are properly separated.');
    return;
  }

  // Get user details for logging
  const conflictingUserIds = new Set(
    conflictingStaffProfiles.map((sp) => sp.userId!).filter(Boolean)
  );
  const conflictingUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(sql`${users.id} IN (${Array.from(conflictingUserIds).map((id) => `'${id}'`).join(',')})`);

  console.log(`⚠️  Found ${conflictingUsers.length} user(s) with inconsistent data:\n`);
  conflictingUsers.forEach((user) => {
    const userStaffProfiles = conflictingStaffProfiles.filter((sp) => sp.userId === user.id);
    console.log(`  - ${user.email} (${user.name}) - ID: ${user.id}`);
    console.log(`    Has ${userStaffProfiles.length} staff profile(s) that need to be removed`);
  });

  if (dualUsers.length === 0) {
    console.log('✅ No inconsistent data found. All users are properly separated.');
    return;
  }

  console.log(`⚠️  Found ${dualUsers.length} user(s) with inconsistent data:\n`);
  dualUsers.forEach((user) => {
    console.log(`  - ${user.email} (${user.name}) - ID: ${user.userId}`);
  });

  console.log('\n🔧 Deleting staff profiles from company members...\n');
  console.log('   (Company members cannot have staff profiles per new architecture)\n');

  // Delete staff profiles for users who are company members
  // Company members should not have staff profiles - they manage staff, not be staff
  for (const staffProfile of conflictingStaffProfiles) {
    if (!staffProfile.userId) continue;

    await db.delete(staffProfiles).where(eq(staffProfiles.id, staffProfile.id));
    const user = conflictingUsers.find((u) => u.id === staffProfile.userId);
    console.log(
      `  ✅ Deleted staff profile "${staffProfile.displayName}" (ID: ${staffProfile.id}) from ${user?.email || staffProfile.userId}`
    );
  }

  console.log('\n✅ Cleanup completed!\n');

  // Verify cleanup
  const remainingStaffProfiles = await db
    .select()
    .from(staffProfiles)
    .where(sql`${staffProfiles.userId} IS NOT NULL`);

  const remainingConflicting = remainingStaffProfiles.filter(
    (sp) => sp.userId && companyMemberUserIds.has(sp.userId)
  );

  if (remainingConflicting.length === 0) {
    console.log('✅ Verification passed. No inconsistent data remaining.');
  } else {
    console.log(
      `⚠️  Warning: ${remainingConflicting.length} staff profile(s) still have conflicting userId:`
    );
    remainingConflicting.forEach((sp) => {
      console.log(`  - ${sp.displayName} (ID: ${sp.id}) - userId: ${sp.userId}`);
    });
  }
}

cleanupDualUsers()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  });

