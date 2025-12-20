import 'dotenv/config';
import { generateIdFromEntropySize } from 'lucia';
import { hash } from 'bcrypt-ts';
import { db } from './index';
import {
  users,
  companies,
  companyMembers,
  branches,
  staffProfiles,
  tips,
  subscriptionPlans,
  payoutBatches,
  payoutItems,
  auditLogs,
} from './schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🌱 Starting database seed...');
  console.log(`📡 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');

    // Generate ID function using lucia (same as the rest of the codebase)
    const generateId = () => generateIdFromEntropySize(10);

    // Clear existing data (optional - comment out if you want to preserve data)
    console.log('🧹 Clearing existing data...');
    await db.delete(payoutItems);
    await db.delete(payoutBatches);
    await db.delete(tips);
    await db.delete(staffProfiles);
    await db.delete(branches);
    await db.delete(companyMembers);
    await db.delete(companies);
    await db.delete(users);
    await db.delete(subscriptionPlans);
    await db.delete(auditLogs);
    console.log('✅ Existing data cleared');

    // 1. Create subscription plans first (no dependencies)
    console.log('📦 Seeding subscription plans...');
    const planNames: Array<'Basic' | 'Pro' | 'Enterprise'> = ['Basic', 'Pro', 'Enterprise'];
    const createdPlans = await db
      .insert(subscriptionPlans)
      .values(
        planNames.map((name) => ({
          id: generateId(),
          name,
          monthlyPricePerBranch:
            name === 'Basic' ? 999 : name === 'Pro' ? 2999 : 9999, // in cents
          features: JSON.stringify({
            maxBranches: name === 'Basic' ? 1 : name === 'Pro' ? 5 : -1,
            analytics: name !== 'Basic',
            customBranding: name === 'Enterprise',
          }),
          active: true,
        }))
      )
      .returning();
    console.log(`   ✅ Created ${createdPlans.length} subscription plans`);

    // 2. Create company users (for company management)
    console.log('👤 Seeding company users...');
    const passwordHash = await hash('password123', 10);
    const companyUserRoles: Array<'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF'> = [
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'STAFF',
      'STAFF',
    ];
    const createdUsers = await db
      .insert(users)
      .values(
        Array.from({ length: 5 }, (_, i) => ({
          id: generateId(),
          name: `Company User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          password_hash: passwordHash,
          role: companyUserRoles[i],
        }))
      )
      .returning();
    console.log(`   ✅ Created ${createdUsers.length} company users`);

    // 3. Create companies
    console.log('🏢 Seeding companies...');
    const companyData = [
      { name: 'Acme Restaurant', country: 'US', currency: 'USD' },
      { name: 'Maple Leaf Cafe', country: 'CA', currency: 'CAD' },
      { name: 'Royal Pub', country: 'UK', currency: 'GBP' },
    ];
    const createdCompanies = await db
      .insert(companies)
      .values(
        companyData.map((data, i) => ({
          id: generateId(),
          name: data.name,
          legalName: `${data.name} Inc.`,
          slug: `company-${i + 1}`,
          country: data.country,
          currency: data.currency,
          subscriptionPlan: (['BASIC', 'PRO', 'ENTERPRISE'] as const)[i],
          subscriptionStatus: 'ACTIVE' as const,
        }))
      )
      .returning();
    console.log(`   ✅ Created ${createdCompanies.length} companies`);

    // 4. Create company members (link users to companies)
    console.log('👥 Seeding company members...');
    await db.insert(companyMembers).values(
      createdCompanies.flatMap((company, companyIdx) =>
        createdUsers.slice(0, 3).map((user, userIdx) => ({
          id: generateId(),
          userId: user.id,
          companyId: company.id,
          role:
            companyIdx === 0 && userIdx === 0
              ? ('OWNER' as const)
              : userIdx === 1
                ? ('ADMIN' as const)
                : ('STAFF' as const),
        }))
      )
    );
    console.log(`   ✅ Created company members`);

    // 5. Create branches
    console.log('🏪 Seeding branches...');
    const createdBranches = await db
      .insert(branches)
      .values(
        createdCompanies.flatMap((company, companyIdx) =>
          Array.from({ length: 2 }, (_, branchIdx) => ({
            id: generateId(),
            companyId: company.id,
            name: `${company.name} - Branch ${branchIdx + 1}`,
            location: `${company.country} - Location ${branchIdx + 1}`,
            slug: `branch-${companyIdx + 1}-${branchIdx + 1}`,
            timezone:
              company.country === 'US'
                ? 'America/New_York'
                : company.country === 'CA'
                  ? 'America/Toronto'
                  : 'Europe/London',
            active: true,
          }))
        )
      )
      .returning();
    console.log(`   ✅ Created ${createdBranches.length} branches`);

    // 6. Create staff users (separate from company users)
    console.log('👔 Creating staff users...');
    const staffUsersPasswordHash = await hash('password123', 10);
    const staffUserCount = createdBranches.length * 2;
    const createdStaffUsers = await db
      .insert(users)
      .values(
        Array.from({ length: staffUserCount }, (_, i) => ({
          id: generateId(),
          name: `Staff Member ${i + 1}`,
          email: `staff${i + 1}@example.com`,
          password_hash: staffUsersPasswordHash,
          role: 'STAFF' as const,
        }))
      )
      .returning();
    console.log(`   ✅ Created ${createdStaffUsers.length} staff users`);

    // 7. Create staff profiles
    console.log('👔 Seeding staff profiles...');
    const positions = ['Server', 'Bartender', 'Host', 'Manager', 'Chef', 'Busser'];
    const createdStaff = await db
      .insert(staffProfiles)
      .values(
        createdBranches.flatMap((branch, branchIdx) =>
          Array.from({ length: 2 }, (_, staffIdx) => {
            const staffUserIndex = branchIdx * 2 + staffIdx;
            const staffUser = createdStaffUsers[staffUserIndex];
            return {
              id: generateId(),
              companyId: branch.companyId,
              branchId: branch.id,
              userId: staffUser.id,
              displayName: `Staff ${staffUserIndex + 1}`,
              position: positions[staffUserIndex % positions.length],
              publicId: generateIdFromEntropySize(16),
              active: true,
            };
          })
        )
      )
      .returning();
    console.log(`   ✅ Created ${createdStaff.length} staff profiles`);

    // 8. Create tips
    console.log('💰 Seeding tips...');
    const paymentStatuses: Array<'SUCCEEDED' | 'PENDING' | 'FAILED'> = [
      'SUCCEEDED',
      'PENDING',
      'FAILED',
    ];
    const distributionStatuses: Array<'PENDING' | 'PAID'> = ['PENDING', 'PAID'];
    const tipsData = createdStaff.flatMap((staff) => {
      const company = createdCompanies.find((c) => c.id === staff.companyId);
      return Array.from({ length: 3 }, () => ({
        id: generateId(),
        companyId: staff.companyId,
        branchId: staff.branchId,
        staffProfileId: staff.id,
        amount: Math.floor(Math.random() * 5000) + 100,
        currency: company?.currency || 'USD',
        paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        distributionStatus:
          distributionStatuses[Math.floor(Math.random() * distributionStatuses.length)],
        paymentProvider: 'STRIPE' as const,
        customerRating: Math.floor(Math.random() * 5) + 1,
      }));
    });
    await db.insert(tips).values(tipsData);
    console.log(`   ✅ Created ${tipsData.length} tips`);

    // 9. Create payout batches
    console.log('💸 Seeding payout batches...');
    const createdPayoutBatches = await db
      .insert(payoutBatches)
      .values(
        createdCompanies.map((company) => {
          const companyBranch = createdBranches.find((b) => b.companyId === company.id);
          return {
            id: generateId(),
            companyId: company.id,
            branchId: companyBranch?.id || null,
            processedByUserId: createdUsers[0].id,
            payoutDate: new Date(),
            totalAmount: Math.floor(Math.random() * 100000) + 10000,
            currency: company.currency,
            status: 'PENDING' as const,
          };
        })
      )
      .returning();
    console.log(`   ✅ Created ${createdPayoutBatches.length} payout batches`);

    // 10. Create payout items
    console.log('📋 Seeding payout items...');
    const payoutItemsData = createdPayoutBatches.flatMap((batch) => {
      const branch = batch.branchId
        ? createdBranches.find((b) => b.id === batch.branchId)
        : null;
      const batchStaff = branch
        ? createdStaff.filter((s) => s.branchId === branch.id)
        : createdStaff.filter((s) => {
            const staffCompany = createdCompanies.find((c) => c.id === s.companyId);
            return staffCompany?.id === batch.companyId;
          });
      return batchStaff.slice(0, 3).map((staff) => ({
        id: generateId(),
        payoutBatchId: batch.id,
        staffProfileId: staff.id,
        amount: Math.floor(Math.random() * 5000) + 1000,
        currency: batch.currency,
      }));
    });
    await db.insert(payoutItems).values(payoutItemsData);
    console.log(`   ✅ Created ${payoutItemsData.length} payout items`);

    // Summary
    console.log('\n✅ Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${createdPlans.length} subscription plans`);
    console.log(`   - ${createdUsers.length} company users`);
    console.log(`   - ${createdStaffUsers.length} staff users`);
    console.log(`   - ${createdCompanies.length} companies`);
    console.log(`   - ${createdBranches.length} branches`);
    console.log(`   - ${createdStaff.length} staff profiles`);
    console.log(`   - ${tipsData.length} tips`);
    console.log(`   - ${createdPayoutBatches.length} payout batches`);
    console.log(`   - ${payoutItemsData.length} payout items`);
    console.log('\n📝 Login credentials:');
    console.log('   Company Users:');
    console.log('     - user1@example.com (SUPER_ADMIN)');
    console.log('     - user2@example.com (ADMIN)');
    console.log('     - user3@example.com (MANAGER)');
    console.log('     - user4@example.com (STAFF)');
    console.log('     - user5@example.com (STAFF)');
    console.log('   Staff Users:');
    console.log(`     - staff1@example.com through staff${createdStaffUsers.length}@example.com`);
    console.log('   Password for all: password123');
    console.log('\n✨ Seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Error seeding database:');
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    } else {
      console.error('   Unknown error:', error);
    }
    process.exit(1);
  }
}

main();