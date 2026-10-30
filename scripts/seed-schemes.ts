/**
 * Seed script: Inserts all 15 schemes into the schemes table.
 *
 * Usage: npm run seed:schemes
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { SCHEMES_SEED } from '../constants/schemes-seed';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\n📋 Inserting ${SCHEMES_SEED.length} schemes...\n`);

  for (const scheme of SCHEMES_SEED) {
    const { data, error } = await supabase
      .from('schemes')
      .upsert(scheme, { onConflict: 'title_en' })
      .select('id, title_en, category');

    if (error) {
      console.error(`❌ Failed: ${scheme.title_en}`, error.message);
    } else {
      console.log(`✅ ${scheme.category.padEnd(16)} | ${data?.[0]?.title_en}`);
    }
  }

  console.log('\n🎉 Scheme seeding complete!\n');
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
