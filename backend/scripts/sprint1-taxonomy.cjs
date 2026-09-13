// Sprint 1 taxonomy migration — idempotent, data-preserving.
// Run: node --env-file=.env.local scripts/sprint1-taxonomy.cjs
const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const stmts = [
  // Category tree
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id integer`,
  `CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories (parent_id)`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text`,

  // Needs (shop-by-need facet)
  `CREATE TABLE IF NOT EXISTS needs (
     id serial PRIMARY KEY,
     name text NOT NULL,
     slug text NOT NULL UNIQUE,
     icon text,
     description text,
     sort_order integer DEFAULT 0 NOT NULL,
     active boolean DEFAULT true NOT NULL
   )`,

  // Product merchandising columns
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS store_stock integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS life_stages jsonb DEFAULT '[]' NOT NULL`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS need_slugs jsonb DEFAULT '[]' NOT NULL`,

  // Community listing intent (locked decision: one flow, for-sale vs for-adoption)
  `ALTER TABLE pet_listings ADD COLUMN IF NOT EXISTS intent text DEFAULT 'sale' NOT NULL`,
  `UPDATE pet_listings SET intent = 'adoption' WHERE price_type IN ('free', 'adoption_fee') AND intent = 'sale'`,
];

(async () => {
  let failed = 0;
  for (const [i, s] of stmts.entries()) {
    try {
      await sql(s);
      console.log(`ok ${i + 1}/${stmts.length}`);
    } catch (e) {
      failed++;
      console.error(`FAIL ${i + 1}: ${s.slice(0, 80)}... -> ${e.message}`);
    }
  }
  if (failed) process.exit(1);
  console.log("✅ Sprint 1 migration complete");
})();
