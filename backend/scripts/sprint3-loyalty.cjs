// Sprint 3 migration — subscriptions, loyalty, referrals, analytics columns.
// Idempotent + data-preserving. Run: node --env-file=.env.local scripts/sprint3-loyalty.cjs
const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const stmts = [
  // Users: referral identity (codes assigned lazily; FK added after backfill-safe insert)
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_idx ON users (referral_code) WHERE referral_code IS NOT NULL`,

  // Orders: loyalty accounting + subscription linkage
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_redeemed integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_earned integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS subscription_id integer`,

  // Products: auto-ship eligibility
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS subscription_eligible boolean DEFAULT false NOT NULL`,

  // Bookings: T-24h reminder dedup marker
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp`,

  // New tables
  `CREATE TABLE IF NOT EXISTS subscriptions (
     id serial PRIMARY KEY,
     user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     product_id integer REFERENCES products(id) ON DELETE SET NULL,
     variant_id integer REFERENCES product_variants(id) ON DELETE SET NULL,
     pet_id integer REFERENCES pets(id) ON DELETE SET NULL,
     product_name text NOT NULL,
     variant_name text,
     image_url text,
     unit_price numeric(10,2) NOT NULL,
     qty integer DEFAULT 1 NOT NULL,
     shipping_address jsonb,
     frequency_days integer DEFAULT 30 NOT NULL,
     status text DEFAULT 'active' NOT NULL,
     next_order_at timestamp NOT NULL,
     last_order_at timestamp,
     cancel_reason text,
     created_at timestamp DEFAULT now() NOT NULL,
     updated_at timestamp DEFAULT now() NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions (user_id)`,
  `CREATE INDEX IF NOT EXISTS subscriptions_next_idx ON subscriptions (next_order_at)`,

  `CREATE TABLE IF NOT EXISTS loyalty_ledger (
     id serial PRIMARY KEY,
     user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     points integer NOT NULL,
     kind text NOT NULL,
     order_id integer,
     note text,
     created_at timestamp DEFAULT now() NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS loyalty_user_idx ON loyalty_ledger (user_id)`,
];

(async () => {
  let failed = 0;
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i];
    try {
      await sql(s);
      console.log(`ok ${i + 1}/${stmts.length}`);
    } catch (e) {
      failed++;
      console.error(`FAIL ${i + 1}: ${s.slice(0, 80)}... -> ${e.message}`);
    }
  }
  if (failed) process.exit(1);
  console.log("✅ Sprint 3 migration complete");
})();
