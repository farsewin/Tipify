/**
 * Script to clear all data from the database
 * 
 * This deletes all data from all tables while preserving the schema.
 * 
 * Run with: npx tsx scripts/reset-database.ts
 */

import { db } from '../drizzle';
import {
  auditLogs,
  payoutItems,
  payoutBatches,
  tips,
  staffProfiles,
  branches,
  companyMembers,
  companies,
  sessions,
  users,
  subscriptionPlans,
  todos,
} from '../drizzle/schema';
import { sql } from 'drizzle-orm';

async function resetDatabase() {
  console.log('🗑️  Starting database reset...\n');

  try {
    // Delete data in reverse dependency order to respect foreign key constraints
    // Wrap each delete in try-catch to handle missing tables gracefully
    
    const deleteTable = async (name: string, deleteFn: () => Promise<any>) => {
      try {
        await deleteFn();
        console.log(`   ✅ Deleted ${name}`);
      } catch (error: any) {
        if (error?.cause?.code === 'SQLITE_ERROR' && error?.cause?.message?.includes('no such table')) {
          console.log(`   ⏭️  ${name} table doesn't exist, skipping`);
        } else {
          throw error;
        }
      }
    };
    
    console.log('📋 Deleting payout items...');
    await deleteTable('payout_items', () => db.delete(payoutItems));
    
    console.log('💸 Deleting payout batches...');
    await deleteTable('payout_batches', () => db.delete(payoutBatches));
    
    console.log('💰 Deleting tips...');
    await deleteTable('tips', () => db.delete(tips));
    
    console.log('👔 Deleting staff profiles...');
    await deleteTable('staff_profiles', () => db.delete(staffProfiles));
    
    console.log('🏪 Deleting branches...');
    await deleteTable('branches', () => db.delete(branches));
    
    console.log('👥 Deleting company members...');
    await deleteTable('company_members', () => db.delete(companyMembers));
    
    console.log('🏢 Deleting companies...');
    await deleteTable('companies', () => db.delete(companies));
    
    console.log('🔐 Deleting sessions...');
    await deleteTable('sessions', () => db.delete(sessions));
    
    console.log('👤 Deleting users...');
    await deleteTable('users', () => db.delete(users));
    
    console.log('📦 Deleting subscription plans...');
    await deleteTable('subscription_plans', () => db.delete(subscriptionPlans));
    
    console.log('📝 Deleting todos...');
    await deleteTable('todos', () => db.delete(todos));
    
    console.log('📊 Deleting audit logs...');
    await deleteTable('audit_logs', () => db.delete(auditLogs));

    console.log('\n✅ Database reset completed successfully!');
    console.log('   All data has been deleted. The schema remains intact.');
    console.log('   You can now run: npm run seed');
  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

resetDatabase()
  .then(() => {
    console.log('\n✨ Reset completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  });

