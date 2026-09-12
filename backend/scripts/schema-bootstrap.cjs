// One-off schema bootstrap matching src/db/schema.ts.
// Run from backend/: node --env-file=.env.local scripts/schema-bootstrap.cjs
// (drizzle-kit 0.20 `push:pg` hangs against Neon serverless here, so we apply DDL directly.)
// Handles the LEGACY PawStore schema: old `products` table had `category`/`pet_type` text
// columns and no slug/mrp/category_id; blogs had no excerpt/read_minutes/updated_at.
const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const stmts = [
  // ===== Users & auth =====
  `CREATE TABLE IF NOT EXISTS users (id serial PRIMARY KEY, phone text NOT NULL UNIQUE, name text, email text, role text DEFAULT 'user' NOT NULL, is_blocked boolean DEFAULT false NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false NOT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email text`,
  `CREATE TABLE IF NOT EXISTS addresses (id serial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE, label text DEFAULT 'Home' NOT NULL, full_name text, phone text, street text NOT NULL, landmark text, city text NOT NULL, state text NOT NULL, zip text NOT NULL, is_default boolean DEFAULT false NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
  `ALTER TABLE addresses ADD COLUMN IF NOT EXISTS full_name text`,
  `ALTER TABLE addresses ADD COLUMN IF NOT EXISTS phone text`,
  `ALTER TABLE addresses ADD COLUMN IF NOT EXISTS landmark text`,
  `CREATE TABLE IF NOT EXISTS otps (id serial PRIMARY KEY, phone text NOT NULL UNIQUE, otp text NOT NULL, name text, attempts integer DEFAULT 0 NOT NULL, expires_at timestamp NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
  `ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE otps ADD COLUMN IF NOT EXISTS name text`,

  // ===== Categories & brands =====
  `CREATE TABLE IF NOT EXISTS categories (id serial PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE, pet_type text DEFAULT 'all' NOT NULL, icon text, sort_order integer DEFAULT 0 NOT NULL, active boolean DEFAULT true NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS pet_type text DEFAULT 'all' NOT NULL`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon text`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL`,
  `CREATE TABLE IF NOT EXISTS brands (id serial PRIMARY KEY, name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE, logo_url text, active boolean DEFAULT true NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,

  // ===== Products (legacy migration) =====
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS pet_type text DEFAULT 'all' NOT NULL`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description text`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp numeric(10,2)`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id integer REFERENCES categories(id)`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id integer REFERENCES brands(id)`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5 NOT NULL`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}'::jsonb`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_grams integer`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false NOT NULL`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller boolean DEFAULT false NOT NULL`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate_percent numeric(5,2) DEFAULT '0'`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL`,
  `CREATE TABLE IF NOT EXISTS product_images (id serial PRIMARY KEY, product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE, url text NOT NULL, alt text, sort_order integer DEFAULT 0 NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS product_variants (id serial PRIMARY KEY, product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE, name text NOT NULL, price_delta numeric(10,2) DEFAULT '0' NOT NULL, stock integer DEFAULT 0 NOT NULL, active boolean DEFAULT true NOT NULL)`,

  // ===== Coupons =====
  `ALTER TABLE coupons ADD COLUMN IF NOT EXISTS description text`,
  `ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount numeric(10,2)`,

  // ===== Cart =====
  `CREATE TABLE IF NOT EXISTS carts (id serial PRIMARY KEY, user_id integer REFERENCES users(id) ON DELETE CASCADE, guest_token text UNIQUE, coupon_id integer REFERENCES coupons(id), created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cart_items (id serial PRIMARY KEY, cart_id integer NOT NULL REFERENCES carts(id) ON DELETE CASCADE, product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE, variant_id integer REFERENCES product_variants(id) ON DELETE SET NULL, qty integer NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,

  // ===== Orders (legacy migration) =====
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal numeric(10,2)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee numeric(10,2) DEFAULT '0' NOT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount numeric(10,2) DEFAULT '0' NOT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address jsonb`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' NOT NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'razorpay'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id integer REFERENCES product_variants(id)`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name text`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name text`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url text`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS subtotal numeric(10,2)`,
  `CREATE TABLE IF NOT EXISTS payments (id serial PRIMARY KEY, order_id integer REFERENCES orders(id), booking_id integer, provider text DEFAULT 'razorpay' NOT NULL, razorpay_order_id text, razorpay_payment_id text, razorpay_signature text, amount numeric(10,2) NOT NULL, status text DEFAULT 'created' NOT NULL, raw jsonb, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL)`,

  // ===== Pets (legacy migration) =====
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS gender text`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS birth_date text`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS age_years integer`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS weight_kg numeric(5,1)`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS vaccinations jsonb DEFAULT '[]'::jsonb`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS medical_notes text`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS groomer_notes text`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL`,

  // ===== Pet listings =====
  `CREATE TABLE IF NOT EXISTS pet_listings (id serial PRIMARY KEY, slug text NOT NULL UNIQUE, listing_type text NOT NULL, owner_id integer REFERENCES users(id) ON DELETE SET NULL, name text NOT NULL, species text NOT NULL, breed text, gender text, age_months integer, age_text text, color text, size text, price numeric(10,2), price_type text DEFAULT 'fixed' NOT NULL, city text, state text, description text, temperament text, health_info text, vaccinated boolean DEFAULT false NOT NULL, vaccination_details text, video_url text, status text DEFAULT 'draft' NOT NULL, moderation_note text, reviewed_by integer REFERENCES users(id), reviewed_at timestamp, is_verified boolean DEFAULT false NOT NULL, featured boolean DEFAULT false NOT NULL, view_count integer DEFAULT 0 NOT NULL, report_count integer DEFAULT 0 NOT NULL, contact_name text, contact_phone text, contact_preference text DEFAULT 'whatsapp' NOT NULL, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS listing_media (id serial PRIMARY KEY, listing_id integer NOT NULL REFERENCES pet_listings(id) ON DELETE CASCADE, url text NOT NULL, type text DEFAULT 'image' NOT NULL, alt text, sort_order integer DEFAULT 0 NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS listing_reports (id serial PRIMARY KEY, listing_id integer NOT NULL REFERENCES pet_listings(id) ON DELETE CASCADE, user_id integer REFERENCES users(id), reason text NOT NULL, details text, status text DEFAULT 'open' NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,

  // ===== Services & bookings =====
  `CREATE TABLE IF NOT EXISTS services (id serial PRIMARY KEY, slug text NOT NULL UNIQUE, name text NOT NULL, description text, long_description text, image_url text, duration_minutes integer DEFAULT 60 NOT NULL, price numeric(10,2) NOT NULL, price_note text, pet_types jsonb DEFAULT '["dog","cat"]'::jsonb NOT NULL, deposit_amount numeric(10,2) DEFAULT '0' NOT NULL, requires_deposit boolean DEFAULT false NOT NULL, active boolean DEFAULT true NOT NULL, sort_order integer DEFAULT 0 NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS bookings (id serial PRIMARY KEY, booking_ref text NOT NULL UNIQUE, user_id integer REFERENCES users(id), service_id integer NOT NULL REFERENCES services(id), pet_id integer REFERENCES pets(id) ON DELETE SET NULL, pet_name text NOT NULL, pet_species text NOT NULL, pet_breed text, pet_notes text, booking_date text NOT NULL, slot_time time NOT NULL, status text DEFAULT 'pending' NOT NULL, customer_name text NOT NULL, customer_phone text NOT NULL, notes text, admin_notes text, amount numeric(10,2) NOT NULL, deposit_paid boolean DEFAULT false NOT NULL, payment_status text DEFAULT 'unpaid' NOT NULL, razorpay_order_id text, cancelled_at timestamp, cancel_reason text, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS booking_blockouts (id serial PRIMARY KEY, date text NOT NULL, slot_time time, reason text, created_at timestamp DEFAULT now() NOT NULL)`,

  // ===== Inquiries =====
  `CREATE TABLE IF NOT EXISTS inquiries (id serial PRIMARY KEY, user_id integer REFERENCES users(id), type text NOT NULL, subject text NOT NULL, message text NOT NULL, related_listing_id integer REFERENCES pet_listings(id) ON DELETE SET NULL, related_product_id integer REFERENCES products(id) ON DELETE SET NULL, related_service_id integer REFERENCES services(id) ON DELETE SET NULL, contact_name text, contact_phone text, contact_email text, status text DEFAULT 'open' NOT NULL, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS inquiry_messages (id serial PRIMARY KEY, inquiry_id integer NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE, sender text NOT NULL, sender_name text, message text NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,

  // ===== Wishlist / notifications / reviews =====
  `CREATE TABLE IF NOT EXISTS wishlist_items (id serial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE, created_at timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS notifications (id serial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE, type text NOT NULL, title text NOT NULL, body text NOT NULL, link text, is_read boolean DEFAULT false NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title text`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' NOT NULL`,

  // ===== Content =====
  `ALTER TABLE blogs ADD COLUMN IF NOT EXISTS excerpt text`,
  `ALTER TABLE blogs ADD COLUMN IF NOT EXISTS read_minutes integer DEFAULT 4 NOT NULL`,
  `ALTER TABLE blogs ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL`,
  `CREATE TABLE IF NOT EXISTS banners (id serial PRIMARY KEY, title text NOT NULL, subtitle text, description text, cta_label text, cta_link text, image_url text, placement text DEFAULT 'hero' NOT NULL, sort_order integer DEFAULT 0 NOT NULL, active boolean DEFAULT true NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS faqs (id serial PRIMARY KEY, question text NOT NULL, answer text NOT NULL, category text DEFAULT 'general' NOT NULL, sort_order integer DEFAULT 0 NOT NULL, active boolean DEFAULT true NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,

  // ===== Settings & audit =====
  `CREATE TABLE IF NOT EXISTS site_settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS audit_log (id serial PRIMARY KEY, actor_id integer REFERENCES users(id), action text NOT NULL, entity_type text, entity_id integer, details jsonb, created_at timestamp DEFAULT now() NOT NULL)`,
];  // Data backfill AFTER tables/columns exist
// Legacy products.category was NOT NULL — drop that since category_id replaces it.
// (Keeps the column for rollback safety, just nullable.)
const relax = [
  `ALTER TABLE products ALTER COLUMN category DROP NOT NULL`,
];

const backfills = [
  // Categories: seed baseline rows (idempotent)
  `INSERT INTO categories (name, slug, pet_type, sort_order) VALUES
     ('Dog Food','dog-food','dog',1),('Cat Food','cat-food','cat',2),('Treats','treats','all',3),
     ('Toys','toys','all',4),('Grooming','grooming','all',5),('Health & Hygiene','health-hygiene','all',6),
     ('Beds & Furniture','beds-furniture','all',7),('Collars & Leashes','collars-leashes','dog',8),
     ('Litter','litter','cat',9),('Accessories','accessories','all',10)
   ON CONFLICT (slug) DO NOTHING`,
  // Map legacy products.category text → category_id, and give every product a slug
  `UPDATE products SET category_id = c.id FROM categories c WHERE c.name = products.category AND products.category_id IS NULL`,
  `UPDATE products SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\\s-]', '', 'g'), '[\\s_]+', '-', 'g')) || '-' || id WHERE slug IS NULL OR slug = ''`,
  // Legacy orders: fill order_number + subtotal from total
  `UPDATE orders SET order_number = 'PS-LEGACY-' || id WHERE order_number IS NULL OR order_number = ''`,
  `UPDATE orders SET subtotal = total WHERE subtotal IS NULL`,
  // Legacy order_items: fill product_name/subtotal
  `UPDATE order_items SET product_name = COALESCE((SELECT name FROM products p WHERE p.id = order_items.product_id), 'Item') WHERE product_name IS NULL`,
  `UPDATE order_items SET subtotal = unit_price * qty WHERE subtotal IS NULL`,
  // Legacy reviews: treat existing reviews as approved (they were auto-published before)
  `UPDATE reviews SET status = 'approved' WHERE status IS NULL OR status = 'pending'`,
  // Legacy blogs: default read minutes + updated_at
  `UPDATE blogs SET read_minutes = 4 WHERE read_minutes IS NULL`,
  `UPDATE blogs SET updated_at = created_at WHERE updated_at IS NULL`,
  `UPDATE pets SET vaccinations = '[]'::jsonb WHERE vaccinations IS NULL`,
];

// Indexes last
const indexes = [
  `CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON products (slug)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON orders (order_number)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS wishlist_user_product_idx ON wishlist_items (user_id, product_id)`,
  `CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id)`,
  `CREATE INDEX IF NOT EXISTS products_brand_idx ON products (brand_id)`,
  `CREATE INDEX IF NOT EXISTS products_pet_type_idx ON products (pet_type)`,
  `CREATE INDEX IF NOT EXISTS carts_user_idx ON carts (user_id)`,
  `CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id)`,
  `CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status)`,
  `CREATE INDEX IF NOT EXISTS payments_rzp_order_idx ON payments (razorpay_order_id)`,
  `CREATE INDEX IF NOT EXISTS pet_listings_status_idx ON pet_listings (status)`,
  `CREATE INDEX IF NOT EXISTS pet_listings_type_idx ON pet_listings (listing_type)`,
  `CREATE INDEX IF NOT EXISTS pet_listings_owner_idx ON pet_listings (owner_id)`,
  `CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (booking_date)`,
  `CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings (user_id)`,
  `CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status)`,
  `CREATE INDEX IF NOT EXISTS blockouts_date_idx ON booking_blockouts (date)`,
  `CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id)`,
  `CREATE INDEX IF NOT EXISTS reviews_target_idx ON reviews (target_type, target_id)`,
];

(async () => {
  try {
    for (const s of stmts) await sql(s);
    console.log("✅ DDL applied");
    for (const s of relax) await sql(s);
    console.log("✅ Constraints relaxed");
    for (let i = 0; i < backfills.length; i++) {
      try {
        await sql(backfills[i]);
      } catch (e) {
        console.error(`❌ backfill[${i}] failed: ${e.message}\n   SQL: ${backfills[i].slice(0, 120)}`);
        throw e;
      }
    }
    console.log("✅ Backfills applied");
    for (const s of indexes) await sql(s);
    console.log("✅ Indexes applied");
    const rows = await sql(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log(`Tables (${rows.length}):`, rows.map((r) => r.table_name).join(", "));
    process.exit(0);
  } catch (e) {
    console.error("❌ SCHEMA ERROR:", e.message);
    process.exit(1);
  }
})();
