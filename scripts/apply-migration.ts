/**
 * Script to apply the staff/company separation migration
 * 
 * This script reads and executes the migration SQL file directly.
 * 
 * Run with: npx tsx scripts/apply-migration.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

async function applyMigration() {
  const migrationPath = join(process.cwd(), 'drizzle/migrations/0001_enforce_staff_company_separation.sql');
  
  console.log('📄 Reading migration file...\n');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Split by statement breakpoints and execute each statement
  const statements = migrationSQL
    .split('--> statement-breakpoint')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`🔧 Executing ${statements.length} migration statements...\n`);

  try {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`  [${i + 1}/${statements.length}] Executing statement...`);
        await db.run(sql.raw(statement));
      }
    }

    console.log('\n✅ Migration applied successfully!\n');
    console.log('✨ The staff_profile table now requires userId and inconsistent data has been cleaned up.');
  } catch (error) {
    console.error('\n❌ Error applying migration:', error);
    throw error;
  }
}

applyMigration()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });







