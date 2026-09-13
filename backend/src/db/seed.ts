import "dotenv/config";
import { db } from "./index";
import {
  users, products, categories, brands, blogCategories, blogs, needs,
  services, petListings, listingMedia, banners, faqs,
} from "./schema";
import { eq, inArray } from "drizzle-orm";

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 70);
}

async function main() {
  console.log("🌱 Seeding PawStore database...");

  // 1. Super Admin + demo user
  const [adminUser] = await db
    .insert(users)
    .values({ phone: "+911234567890", name: "Ritesh (Admin)", role: "admin" })
    .onConflictDoUpdate({ target: users.phone, set: { role: "admin", name: "Ritesh (Admin)" } })
    .returning();
  console.log(`✅ Admin ready: ${adminUser.name}`);

  const [user1] = await db
    .insert(users)
    .values({ phone: "+919999999999", name: "Amit Sharma", role: "user" })
    .onConflictDoUpdate({ target: users.phone, set: { name: "Amit Sharma" } })
    .returning();

  // 2. Product taxonomy — PET TYPE → NEED → CATEGORY → SUBCATEGORY
  // Tree structure: groups (parentId=null) → leaf categories. See PRODUCT_AUDIT_V2.md §6.
  console.log("🗂️ Seeding taxonomy (categories + needs)...");

  const TREE: { name: string; slug: string; petType: string; children?: { name: string; slug: string }[] }[] = [
    // ---- DOGS ----
    { name: "Food & Nutrition", slug: "dog-food-nutrition", petType: "dog", children: [
      { name: "Dry Food", slug: "dog-dry-food" }, { name: "Wet Food", slug: "dog-wet-food" },
      { name: "Puppy Food", slug: "dog-puppy-food" }, { name: "Adult Food", slug: "dog-adult-food" },
      { name: "Senior Food", slug: "dog-senior-food" }, { name: "Special Diets", slug: "dog-special-diets" },
      { name: "Veterinary Diets", slug: "dog-veterinary-diets" },
    ]},
    { name: "Treats & Rewards", slug: "dog-treats", petType: "dog", children: [
      { name: "Biscuits", slug: "dog-biscuits" }, { name: "Training Treats", slug: "dog-training-treats" },
      { name: "Dental Treats", slug: "dog-dental-treats" }, { name: "Meaty Treats", slug: "dog-meaty-treats" },
      { name: "Puppy Treats", slug: "dog-puppy-treats" },
    ]},
    { name: "Toys & Play", slug: "dog-toys", petType: "dog", children: [
      { name: "Chew Toys", slug: "dog-chew-toys" }, { name: "Interactive Toys", slug: "dog-interactive-toys" },
      { name: "Fetch Toys", slug: "dog-fetch-toys" }, { name: "Rope & Tug", slug: "dog-rope-tug" },
      { name: "Plush Toys", slug: "dog-plush-toys" },
    ]},
    { name: "Grooming & Hygiene", slug: "dog-grooming", petType: "dog", children: [
      { name: "Shampoo", slug: "dog-shampoo" }, { name: "Conditioner", slug: "dog-conditioner" },
      { name: "Grooming Tools", slug: "dog-grooming-tools" }, { name: "Brushes & Combs", slug: "dog-brushes-combs" },
      { name: "Wipes", slug: "dog-wipes" }, { name: "Paw Care", slug: "dog-paw-care" },
    ]},
    { name: "Health & Wellness", slug: "dog-health-wellness", petType: "dog", children: [
      { name: "Supplements", slug: "dog-supplements" }, { name: "Vitamins", slug: "dog-vitamins" },
      { name: "Wellness", slug: "dog-wellness" },
    ]},
    { name: "Tick & Flea Care", slug: "dog-tick-flea", petType: "dog", children: [
      { name: "Tick Care", slug: "dog-tick-care" }, { name: "Flea Care", slug: "dog-flea-care" },
      { name: "Preventive Care", slug: "dog-preventive-care" },
    ]},
    { name: "Dental Care", slug: "dog-dental-care", petType: "dog", children: [
      { name: "Toothbrushes", slug: "dog-toothbrushes" }, { name: "Toothpaste", slug: "dog-toothpaste" },
      { name: "Dental Chews", slug: "dog-dental-chews" },
    ]},
    { name: "Walking & Outdoor", slug: "dog-walking-outdoor", petType: "dog", children: [
      { name: "Collars", slug: "dog-collars" }, { name: "Harnesses", slug: "dog-harnesses" },
      { name: "Leashes", slug: "dog-leashes" }, { name: "Name Tags", slug: "dog-name-tags" },
    ]},
    { name: "Beds & Comfort", slug: "dog-beds-comfort", petType: "dog", children: [
      { name: "Beds", slug: "dog-beds" }, { name: "Mats", slug: "dog-mats" }, { name: "Blankets", slug: "dog-blankets" },
    ]},
    { name: "Bowls & Feeding", slug: "dog-bowls-feeding", petType: "dog", children: [
      { name: "Bowls", slug: "dog-bowls" }, { name: "Feeders", slug: "dog-feeders" }, { name: "Water Dispensers", slug: "dog-water-dispensers" },
    ]},
    { name: "Travel", slug: "dog-travel", petType: "dog", children: [
      { name: "Carriers", slug: "dog-carriers" }, { name: "Travel Bowls", slug: "dog-travel-bowls" }, { name: "Car Safety", slug: "dog-car-safety" },
    ]},
    { name: "Clothing & Accessories", slug: "dog-clothing-accessories", petType: "dog", children: [
      { name: "Clothing", slug: "dog-clothing" }, { name: "Bandanas", slug: "dog-bandanas" }, { name: "Accessories", slug: "dog-accessories" },
    ]},
    // ---- CATS ----
    { name: "Food", slug: "cat-food", petType: "cat", children: [
      { name: "Dry Food", slug: "cat-dry-food" }, { name: "Wet Food", slug: "cat-wet-food" },
      { name: "Kitten Food", slug: "cat-kitten-food" }, { name: "Adult Food", slug: "cat-adult-food" }, { name: "Senior Food", slug: "cat-senior-food" },
    ]},
    { name: "Treats", slug: "cat-treats", petType: "cat", children: [
      { name: "Crunchy Treats", slug: "cat-crunchy-treats" }, { name: "Creamy Treats", slug: "cat-creamy-treats" }, { name: "Dental Treats", slug: "cat-dental-treats" },
    ]},
    { name: "Toys", slug: "cat-toys", petType: "cat", children: [
      { name: "Wand Toys", slug: "cat-wand-toys" }, { name: "Catnip Toys", slug: "cat-catnip-toys" },
      { name: "Balls & Mice", slug: "cat-balls-mice" }, { name: "Interactive Toys", slug: "cat-interactive-toys" },
    ]},
    { name: "Litter & Hygiene", slug: "cat-litter-hygiene", petType: "cat", children: [
      { name: "Litter", slug: "cat-litter" }, { name: "Litter Trays", slug: "cat-litter-trays" },
      { name: "Litter Mats", slug: "cat-litter-mats" }, { name: "Deodorizers", slug: "cat-deodorizers" },
    ]},
    { name: "Scratchers & Trees", slug: "cat-scratchers-trees", petType: "cat", children: [
      { name: "Scratchers", slug: "cat-scratchers" }, { name: "Cat Trees", slug: "cat-trees" },
    ]},
    { name: "Grooming", slug: "cat-grooming", petType: "cat", children: [
      { name: "Brushes & Combs", slug: "cat-brushes-combs" }, { name: "Shampoo", slug: "cat-shampoo" }, { name: "Wipes", slug: "cat-wipes" },
    ]},
    { name: "Health & Wellness", slug: "cat-health-wellness", petType: "cat", children: [
      { name: "Supplements", slug: "cat-supplements" }, { name: "Tick & Flea", slug: "cat-tick-flea" },
    ]},
    { name: "Dental Care", slug: "cat-dental-care", petType: "cat", children: [
      { name: "Dental Chews", slug: "cat-dental-chews" }, { name: "Toothpaste", slug: "cat-toothpaste" },
    ]},
    { name: "Bowls & Feeding", slug: "cat-bowls-feeding", petType: "cat", children: [
      { name: "Bowls", slug: "cat-bowls" }, { name: "Water Fountains", slug: "cat-water-fountains" },
    ]},
    { name: "Carriers & Travel", slug: "cat-carriers-travel", petType: "cat", children: [
      { name: "Carriers", slug: "cat-carriers" },
    ]},
    { name: "Beds & Comfort", slug: "cat-beds-comfort", petType: "cat", children: [
      { name: "Beds", slug: "cat-beds" }, { name: "Blankets", slug: "cat-blankets" },
    ]},
    { name: "Collars & Accessories", slug: "cat-collars-accessories", petType: "cat", children: [
      { name: "Collars", slug: "cat-collars" }, { name: "Accessories", slug: "cat-accessories" },
    ]},
    // ---- SMALL PETS ----
    { name: "Food & Hay", slug: "small-food-hay", petType: "small_pet", children: [
      { name: "Food", slug: "small-food" }, { name: "Hay & Grass", slug: "small-hay-grass" },
    ]},
    { name: "Treats & Chews", slug: "small-treats-chews", petType: "small_pet", children: [
      { name: "Treats", slug: "small-treats" }, { name: "Chews", slug: "small-chews" },
    ]},
    { name: "Housing", slug: "small-housing", petType: "small_pet", children: [
      { name: "Cages & Hutches", slug: "small-cages-hutches" }, { name: "Bedding", slug: "small-bedding" },
    ]},
    { name: "Toys & Accessories", slug: "small-toys-accessories", petType: "small_pet", children: [
      { name: "Exercise Wheels", slug: "small-exercise-wheels" }, { name: "Toys", slug: "small-toys" }, { name: "Accessories", slug: "small-accessories" },
    ]},
    { name: "Care", slug: "small-care", petType: "small_pet", children: [
      { name: "Grooming", slug: "small-grooming" }, { name: "Health", slug: "small-health" },
    ]},
  ];

  // Deactivate legacy flat categories (replaced by the tree)
  await db.update(categories).set({ active: false }).where(inArray(categories.slug, [
    "dog-food", "cat-food", "treats", "toys", "grooming", "health-hygiene",
    "beds-furniture", "collars-leashes", "litter", "accessories",
  ]));

  const catBySlug = new Map<string, { id: number }>();
  let groupOrder = 0;
  for (const group of TREE) {
    const [parent] = await db
      .insert(categories)
      .values({ name: group.name, slug: group.slug, petType: group.petType, sortOrder: ++groupOrder, active: true })
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: group.name, petType: group.petType, sortOrder: groupOrder, active: true, parentId: null },
      })
      .returning();
    catBySlug.set(group.slug, parent);
    let leafOrder = 0;
    for (const leaf of group.children ?? []) {
      const [child] = await db
        .insert(categories)
        .values({ name: leaf.name, slug: leaf.slug, petType: group.petType, parentId: parent.id, sortOrder: ++leafOrder, active: true })
        .onConflictDoUpdate({
          target: categories.slug,
          set: { name: leaf.name, petType: group.petType, parentId: parent.id, sortOrder: leafOrder, active: true },
        })
        .returning();
      catBySlug.set(leaf.slug, child);
    }
  }
  console.log(`   ${catBySlug.size} taxonomy nodes`);

  // Shop-by-Need facets (cross-pet, problem-first navigation)
  const NEEDS = [
    { name: "New Pet Essentials", slug: "new-pet-essentials" },
    { name: "Food & Nutrition", slug: "food-nutrition" },
    { name: "Grooming", slug: "grooming" },
    { name: "Health & Wellness", slug: "health-wellness" },
    { name: "Tick & Flea", slug: "tick-flea" },
    { name: "Dental Care", slug: "dental-care" },
    { name: "Walking & Outdoor", slug: "walking-outdoor" },
    { name: "Travel", slug: "travel" },
    { name: "Beds & Comfort", slug: "beds-comfort" },
    { name: "Toys & Play", slug: "toys-play" },
    { name: "Bowls & Feeding", slug: "feeding" },
    { name: "Treats & Training", slug: "training-treats" },
    { name: "Litter & Hygiene", slug: "litter-hygiene" },
  ];
  for (let i = 0; i < NEEDS.length; i++) {
    const n = NEEDS[i];
    await db.insert(needs).values({ ...n, sortOrder: i + 1 }).onConflictDoUpdate({ target: needs.slug, set: { name: n.name, sortOrder: i + 1, active: true } });
  }

  // 3. Brands
  console.log("🏷️ Seeding brands...");
  const brandNames = ["Royal Canin", "Whiskas", "Pedigree", "Trixie", "KONG", "Orijen", "Hills", "Farmina", "Drools"];
  for (const name of brandNames) {
    await db.insert(brands).values({ name, slug: slugify(name) }).onConflictDoNothing();
  }
  const brandRows = await db.select().from(brands);
  const brandByName = Object.fromEntries(brandRows.map((b) => [b.name, b]));

  // 4. Products — UPDATE canonical slugs into the new tree, INSERT new coverage.
  // storeStock = physical shelf inventory (DECISION: separate from online stock).
  console.log("🛒 Seeding products...");

  type P = {
    name: string; price: string; mrp: string; brand: string; cat: string; petType: string;
    stock: number; storeStock: number; lifeStages: string[]; needSlugs: string[];
    featured: boolean; bestSeller: boolean; imageUrl: string; description: string;
  };

  const productData: P[] = [
    { name: "Royal Canin Maxi Puppy Kibble (4kg)", price: "1599.00", mrp: "1999.00", brand: "Royal Canin", cat: "dog-puppy-food", petType: "dog", stock: 50, storeStock: 8, lifeStages: ["puppy"], needSlugs: ["food-nutrition", "new-pet-essentials"], featured: true, bestSeller: true, imageUrl: "/images/food.png", description: "Premium dry dog food tailored for large breed puppies (adult weight 26-44kg) up to 15 months. Supports digestive health and natural defences." },
    { name: "Whiskas Wet Cat Food (Salmon in Gravy) - 12 Pack", price: "480.00", mrp: "599.00", brand: "Whiskas", cat: "cat-wet-food", petType: "cat", stock: 120, storeStock: 12, lifeStages: ["adult"], needSlugs: ["food-nutrition"], featured: true, bestSeller: true, imageUrl: "/images/food.png", description: "Delicious wet cat food chunks in gravy for adult cats. Balanced nutrition with zinc and omega-6 for healthy skin and coat." },
    { name: "Premium Retractable Dog Leash (5m)", price: "899.00", mrp: "1199.00", brand: "Trixie", cat: "dog-leashes", petType: "dog", stock: 35, storeStock: 6, lifeStages: [], needSlugs: ["walking-outdoor"], featured: true, bestSeller: false, imageUrl: "/images/hero.png", description: "Heavy-duty retractable leash with anti-slip grip and one-handed brake system. Suitable for dogs up to 25kg." },
    { name: "Orthopedic Memory Foam Pet Bed (Large)", price: "3499.00", mrp: "4499.00", brand: "Trixie", cat: "dog-beds", petType: "all", stock: 15, storeStock: 2, lifeStages: ["adult", "senior"], needSlugs: ["beds-comfort"], featured: true, bestSeller: true, imageUrl: "/images/hero.png", description: "Joint-relief memory foam bed with removable, machine-washable ultra-soft cover. Ideal for aging or active pets." },
    { name: "Organic Aloe Vera Dog Shampoo (500ml)", price: "450.00", mrp: "599.00", brand: "Drools", cat: "dog-shampoo", petType: "dog", stock: 80, storeStock: 10, lifeStages: [], needSlugs: ["grooming"], featured: true, bestSeller: true, imageUrl: "/images/grooming.png", description: "Soap-free, hypoallergenic oatmeal and aloe vera shampoo. Soothes dry, itchy skin and leaves your pup smelling fresh." },
    { name: "Self-Cleaning Deshedding Grooming Brush", price: "599.00", mrp: "799.00", brand: "Trixie", cat: "dog-brushes-combs", petType: "all", stock: 60, storeStock: 8, lifeStages: [], needSlugs: ["grooming"], featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "One-click self-cleaning slicker brush for dogs and cats. Gently removes loose undercoat, mats, and tangled hair." },
    { name: "Interactive Wobble Treat Dispensing Dog Toy", price: "699.00", mrp: "899.00", brand: "KONG", cat: "dog-interactive-toys", petType: "dog", stock: 45, storeStock: 5, lifeStages: [], needSlugs: ["toys-play"], featured: true, bestSeller: true, imageUrl: "/images/adoption.png", description: "Durable, non-toxic rubber treat dispenser. Keeps dogs mentally stimulated and physically active." },
    { name: "Cat Feather Teaser Wand & Crinkle Balls Set", price: "349.00", mrp: "449.00", brand: "Trixie", cat: "cat-wand-toys", petType: "cat", stock: 100, storeStock: 10, lifeStages: [], needSlugs: ["toys-play"], featured: false, bestSeller: true, imageUrl: "/images/adoption.png", description: "Flexible wand with feathers, bells, and 5 colorful crinkle balls to keep kittens engaged." },
    { name: "BarkOut Multivitamin Tablets for Dogs (60 Tabs)", price: "799.00", mrp: "999.00", brand: "Drools", cat: "dog-vitamins", petType: "dog", stock: 75, storeStock: 6, lifeStages: [], needSlugs: ["health-wellness"], featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "Vet-approved daily multivitamin supplements with essential minerals, calcium, and amino acids for immunity, bone, and joint health." },
    { name: "Spot-On Tick & Flea Prevention for Small Dogs", price: "420.00", mrp: "520.00", brand: "Drools", cat: "dog-preventive-care", petType: "dog", stock: 90, storeStock: 9, lifeStages: [], needSlugs: ["tick-flea", "health-wellness"], featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "Fast-acting, long-lasting tick and flea treatment. One application protects for up to 30 days." },
    { name: "Durable Nylon Chew Toy Bone for Aggressive Chewers", price: "549.00", mrp: "699.00", brand: "KONG", cat: "dog-chew-toys", petType: "dog", stock: 65, storeStock: 4, lifeStages: [], needSlugs: ["toys-play"], featured: false, bestSeller: true, imageUrl: "/images/adoption.png", description: "Heavy-duty nylon bone for dogs who love to chew. Helps clean teeth and keeps your pup engaged for hours." },
    { name: "Stainless Steel Double Diner Pet Bowls (2 Pack)", price: "699.00", mrp: "899.00", brand: "Trixie", cat: "dog-bowls", petType: "all", stock: 80, storeStock: 10, lifeStages: [], needSlugs: ["feeding"], featured: false, bestSeller: true, imageUrl: "/images/hero.png", description: "Anti-skid stainless steel bowls with rubber base. Perfect for food and water. Dishwasher safe." },
    { name: "Pet Wipes - Gentle Cleaning (100 Wipes Pack)", price: "299.00", mrp: "399.00", brand: "Drools", cat: "dog-wipes", petType: "all", stock: 200, storeStock: 15, lifeStages: [], needSlugs: ["grooming"], featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "Aloe vera and vitamin E enriched wipes for gentle cleaning of paws, face, and body. Safe for daily use." },
    { name: "Joint Care Chews for Senior Dogs (90 Chews)", price: "999.00", mrp: "1299.00", brand: "Hills", cat: "dog-supplements", petType: "dog", stock: 40, storeStock: 5, lifeStages: ["senior"], needSlugs: ["health-wellness"], featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "Advanced glucosamine and chondroitin formula supporting hip and joint health in senior dogs. Chicken-flavored soft chews." },
    { name: "Clumping Cat Litter - Lavender Scent (10kg)", price: "749.00", mrp: "899.00", brand: "Drools", cat: "cat-litter", petType: "cat", stock: 55, storeStock: 8, lifeStages: [], needSlugs: ["litter-hygiene"], featured: true, bestSeller: true, imageUrl: "/images/food.png", description: "Superior clumping cat litter with odor control. Low dust, long lasting, easy to scoop." },
    { name: "Chicken Liver Training Treats for Dogs (200g)", price: "249.00", mrp: "329.00", brand: "Drools", cat: "dog-training-treats", petType: "dog", stock: 150, storeStock: 12, lifeStages: [], needSlugs: ["training-treats"], featured: true, bestSeller: true, imageUrl: "/images/food.png", description: "High-value soft training treats made with real chicken liver. No artificial colors or preservatives." },
    // ---- New coverage: gaps the taxonomy exposed ----
    { name: "Adult Dry Dog Food - Chicken & Rice (3kg)", price: "749.00", mrp: "949.00", brand: "Drools", cat: "dog-adult-food", petType: "dog", stock: 60, storeStock: 7, lifeStages: ["adult"], needSlugs: ["food-nutrition"], featured: false, bestSeller: true, imageUrl: "/images/food.png", description: "Complete and balanced dry food for adult dogs, with real chicken as the first ingredient. Supports muscle maintenance and healthy digestion." },
    { name: "Grain-Free Puppy Starter Dry Food (1.5kg)", price: "1150.00", mrp: "1399.00", brand: "Farmina", cat: "dog-puppy-food", petType: "dog", stock: 30, storeStock: 4, lifeStages: ["puppy"], needSlugs: ["food-nutrition", "new-pet-essentials"], featured: false, bestSeller: false, imageUrl: "/images/food.png", description: "Grain-free, high-protein starter kibble for puppies of all breeds. Small pellets for easy weaning and digestion." },
    { name: "Dental Sticks Daily Oral Care for Dogs (28 Pack)", price: "399.00", mrp: "499.00", brand: "Pedigree", cat: "dog-dental-chews", petType: "dog", stock: 85, storeStock: 10, lifeStages: ["adult"], needSlugs: ["dental-care"], featured: false, bestSeller: true, imageUrl: "/images/food.png", description: "Daily dental sticks with a textured chew design that reduces plaque and tartar build-up while freshening breath." },
    { name: "Rope Tug Toy for Dogs (Large)", price: "299.00", mrp: "399.00", brand: "KONG", cat: "dog-rope-tug", petType: "dog", stock: 70, storeStock: 9, lifeStages: [], needSlugs: ["toys-play"], featured: false, bestSeller: false, imageUrl: "/images/adoption.png", description: "Sturdy cotton rope tug with knotted ends — perfect for interactive play and gentle teeth cleaning." },
    { name: "Plush Squeaky Companion Toy for Puppies", price: "349.00", mrp: "449.00", brand: "Trixie", cat: "dog-plush-toys", petType: "dog", stock: 55, storeStock: 6, lifeStages: ["puppy"], needSlugs: ["toys-play", "new-pet-essentials"], featured: false, bestSeller: false, imageUrl: "/images/adoption.png", description: "Soft plush toy with built-in squeaker and crinkle paper. Comforts puppies and satisfies natural foraging instincts." },
    { name: "Dog Dental Kit - Toothbrush & Enzymatic Toothpaste", price: "499.00", mrp: "649.00", brand: "Trixie", cat: "dog-toothpaste", petType: "dog", stock: 40, storeStock: 5, lifeStages: [], needSlugs: ["dental-care"], featured: false, bestSeller: false, imageUrl: "/images/grooming.png", description: "Complete dental care kit with dual-head toothbrush and poultry-flavored enzymatic toothpaste. No rinsing needed." },
    { name: "Padded Adjustable Dog Harness (Medium)", price: "899.00", mrp: "1099.00", brand: "Trixie", cat: "dog-harnesses", petType: "dog", stock: 45, storeStock: 7, lifeStages: [], needSlugs: ["walking-outdoor"], featured: false, bestSeller: true, imageUrl: "/images/hero.png", description: "Soft-padded, step-in harness with reflective stitching and four adjustment points for a secure, comfortable fit." },
    { name: "Personalized Bone ID Name Tag", price: "249.00", mrp: "349.00", brand: "Trixie", cat: "dog-name-tags", petType: "all", stock: 100, storeStock: 0, lifeStages: [], needSlugs: ["walking-outdoor", "new-pet-essentials"], featured: false, bestSeller: false, imageUrl: "/images/hero.png", description: "Engraved bone-shaped ID tag in stainless steel. Enter your pet's name and your phone number at checkout notes — engraving done at our shop." },
    { name: "Washable Pet Blanket (Medium)", price: "549.00", mrp: "699.00", brand: "Trixie", cat: "dog-blankets", petType: "all", stock: 50, storeStock: 8, lifeStages: [], needSlugs: ["beds-comfort"], featured: false, bestSeller: false, imageUrl: "/images/hero.png", description: "Ultra-soft, machine-washable fleece blanket for crates, beds, sofas, and car seats. Protects furniture from fur and dirt." },
    { name: "Slow-Feeder Bowl (Anti-Gulping)", price: "649.00", mrp: "849.00", brand: "Trixie", cat: "dog-feeders", petType: "dog", stock: 38, storeStock: 5, lifeStages: [], needSlugs: ["feeding"], featured: false, bestSeller: true, imageUrl: "/images/hero.png", description: "Maze-pattern bowl that slows fast eaters by up to 5x, reducing bloat, choking, and post-meal vomiting." },
    { name: "Foldable Travel Carrier (Airline-Approved)", price: "1899.00", mrp: "2399.00", brand: "Trixie", cat: "cat-carriers", petType: "all", stock: 25, storeStock: 3, lifeStages: [], needSlugs: ["travel"], featured: false, bestSeller: false, imageUrl: "/images/hero.png", description: "Soft-sided folding carrier with mesh ventilation, safety tether, and machine-washable base. Approved for most airlines." },
    { name: "Catnip Crunchy Treats (60g)", price: "149.00", mrp: "199.00", brand: "Whiskas", cat: "cat-crunchy-treats", petType: "cat", stock: 140, storeStock: 14, lifeStages: [], needSlugs: ["training-treats"], featured: false, bestSeller: true, imageUrl: "/images/food.png", description: "Irresistible crunchy treats with real catnip — perfect for training, bonding, and treating between meals." },
    { name: "Sisal Scratching Post (Tall, 60cm)", price: "1299.00", mrp: "1599.00", brand: "Trixie", cat: "cat-scratchers", petType: "cat", stock: 20, storeStock: 4, lifeStages: [], needSlugs: ["toys-play"], featured: false, bestSeller: true, imageUrl: "/images/adoption.png", description: "Natural sisal rope post on a sturdy carpet base. Saves your furniture by giving cats a dedicated scratching spot." },
    { name: "Cat Litter Trapping Mat (Large)", price: "499.00", mrp: "649.00", brand: "Trixie", cat: "cat-litter-mats", petType: "cat", stock: 48, storeStock: 6, lifeStages: [], needSlugs: ["litter-hygiene"], featured: false, bestSeller: false, imageUrl: "/images/hero.png", description: "Honeycomb-textured mat that catches scattered litter from paws. Waterproof base, easy to empty and clean." },
    { name: "Cat Water Fountain (2L, Ultra-Quiet)", price: "1799.00", mrp: "2199.00", brand: "Trixie", cat: "cat-water-fountains", petType: "cat", stock: 22, storeStock: 3, lifeStages: [], needSlugs: ["feeding"], featured: false, bestSeller: true, imageUrl: "/images/hero.png", description: "Circulating water fountain with triple filtration. Encourages cats to drink more, supporting urinary tract health." },
    { name: "Premium Timothy Hay for Small Pets (1kg)", price: "399.00", mrp: "499.00", brand: "Trixie", cat: "small-hay-grass", petType: "small_pet", stock: 90, storeStock: 12, lifeStages: [], needSlugs: ["food-nutrition"], featured: false, bestSeller: true, imageUrl: "/images/food.png", description: "Sun-dried, long-strand timothy hay — the daily dietary essential for rabbits, guinea pigs and chinchillas." },
    { name: "Silent Exercise Wheel for Hamsters (20cm)", price: "549.00", mrp: "699.00", brand: "Trixie", cat: "small-exercise-wheels", petType: "small_pet", stock: 60, storeStock: 8, lifeStages: [], needSlugs: ["toys-play"], featured: false, bestSeller: false, imageUrl: "/images/adoption.png", description: "Whisper-quiet spin wheel with a solid running surface — safe for tiny paws and peaceful for night-time activity." },
    { name: "Soft Cotton Bedding for Small Pets (5L)", price: "299.00", mrp: "379.00", brand: "Trixie", cat: "small-bedding", petType: "small_pet", stock: 75, storeStock: 10, lifeStages: [], needSlugs: ["beds-comfort"], featured: false, bestSeller: false, imageUrl: "/images/hero.png", description: "Dust-free, biodegradable cotton bedding. Soft on paws, highly absorbent, and perfect for burrowing nests." },
  ];

  for (const p of productData) {
    const values = {
      slug: slugify(p.name),
      name: p.name,
      description: p.description,
      shortDescription: p.description.slice(0, 120),
      price: p.price,
      mrp: p.mrp,
      categoryId: catBySlug.get(p.cat)?.id ?? null,
      brandId: brandByName[p.brand]?.id ?? null,
      petType: p.petType,
      stock: p.stock,
      storeStock: p.storeStock,
      lifeStages: p.lifeStages,
      needSlugs: p.needSlugs,
      lowStockThreshold: 5,
      imageUrl: p.imageUrl,
      isFeatured: p.featured,
      isBestSeller: p.bestSeller,
      // Auto-ship eligible: recurring-consumable categories (food, treats, litter, hay, supplements)
      subscriptionEligible: [
        "dog-puppy-food", "dog-adult-food", "dog-wet-food", "dog-senior-food",
        "cat-wet-food", "cat-dry-food", "cat-litter", "small-hay-grass",
        "dog-supplements", "dog-training-treats", "cat-crunchy-treats", "dog-dental-chews",
      ].includes(p.cat),
      active: true,
    };
    // Update in place if the slug already exists (remaps canonical products into the tree),
    // otherwise insert.
    const updated = await db.update(products).set(values).where(eq(products.slug, values.slug)).returning();
    if (updated.length === 0) {
      await db.insert(products).values(values).onConflictDoNothing();
    }
  }
  console.log(`✅ Products seeded/updated (${productData.length}).`);

  // 5. Services
  console.log("✂️ Seeding services...");
  const serviceData = [
    { name: "Full Grooming (Bath + Haircut)", description: "Complete spa session — bath, blow-dry, haircut, nail trim, ear cleaning & finishing spritz.", price: "999.00", durationMinutes: 90, petTypes: ["dog"], deposit: "200.00", requiresDeposit: true, sortOrder: 1 },
    { name: "Bath & Blow Dry", description: "Gentle shampoo bath with conditioner, thorough blow-dry and brush-out.", price: "499.00", durationMinutes: 45, petTypes: ["dog", "cat"], deposit: "0", requiresDeposit: false, sortOrder: 2 },
    { name: "Cat Grooming Session", description: "Cat-friendly grooming — brushing, de-matting, nail trim and gentle wipe-down.", price: "699.00", durationMinutes: 60, petTypes: ["cat"], deposit: "0", requiresDeposit: false, sortOrder: 3 },
    { name: "Nail Trimming", description: "Quick, safe nail trim with file finish by experienced hands.", price: "199.00", durationMinutes: 20, petTypes: ["dog", "cat", "small_pet"], deposit: "0", requiresDeposit: false, sortOrder: 4 },
    { name: "Ear Cleaning", description: "Gentle ear cleaning with vet-approved solution for hygiene and infection prevention.", price: "199.00", durationMinutes: 20, petTypes: ["dog", "cat"], deposit: "0", requiresDeposit: false, sortOrder: 5 },
    { name: "Tick & Flea Treatment Bath", description: "Medicated anti-tick shampoo bath with full inspection and after-care advice.", price: "649.00", durationMinutes: 50, petTypes: ["dog"], deposit: "0", requiresDeposit: false, sortOrder: 6 },
  ];
  for (const s of serviceData) {
    await db
      .insert(services)
      .values({
        slug: slugify(s.name),
        name: s.name,
        description: s.description,
        longDescription: `${s.description}\n\nPerformed by our experienced in-shop groomers. You're welcome to wait and watch, or shop while your pet is being pampered. Bring your pet's vaccination records on the first visit.`,
        imageUrl: "/images/grooming.png",
        durationMinutes: s.durationMinutes,
        price: s.price,
        petTypes: s.petTypes,
        depositAmount: s.deposit,
        requiresDeposit: s.requiresDeposit,
        active: true,
        sortOrder: s.sortOrder,
      })
      .onConflictDoNothing();
  }

  // 6. Business pet listings
  console.log("🐾 Seeding business pet listings...");
  const businessPets = [
    { name: "Simba", species: "Dog", breed: "Golden Retriever", gender: "male", ageText: "3 months", ageMonths: 3, price: "25000", city: "Mumbai", temperament: "Playful, gentle with kids", description: "Home-bred Golden Retriever puppy, kibble-trained and very social. Both parents available to meet at the shop. Vaccination card provided." },
    { name: "Misty", species: "Cat", breed: "Persian", gender: "female", ageText: "5 months", ageMonths: 5, price: "18000", city: "Mumbai", temperament: "Calm, indoor-loving", description: "Beautiful cream Persian kitten, litter-trained and dewormed. Comes with starter kit (litter, food, toys)." },
    { name: "Coco", species: "Dog", breed: "Beagle", gender: "female", ageText: "4 months", ageMonths: 4, price: "22000", city: "Mumbai", temperament: "Energetic, food-motivated", description: "Healthy Beagle pup from our own litters. Microchipped, vaccinated and vet-checked. Free vet consultation for the first month." },
    { name: "Pepper", species: "Small Pet", breed: "Dutch Rabbit", gender: "male", ageText: "6 months", ageMonths: 6, price: "2500", city: "Mumbai", temperament: "Friendly, litter-trained", description: "Adorable Dutch rabbit, hand-raised at our shop. Very comfortable with handling. Cage and starter hay included." },
  ];
  for (const pet of businessPets) {
    const [listing] = await db
      .insert(petListings)
      .values({
        slug: `${slugify(pet.name)}-${pet.breed.toLowerCase().replace(/\s+/g, "-")}`,
        listingType: "business",
        ownerId: null,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        ageMonths: pet.ageMonths,
        ageText: pet.ageText,
        price: pet.price,
        priceType: "fixed",
        city: pet.city,
        state: "Maharashtra",
        description: pet.description,
        temperament: pet.temperament,
        healthInfo: "Vet-checked, dewormed and healthy",
        vaccinated: true,
        vaccinationDetails: "Age-appropriate vaccination completed. Card provided on purchase.",
        status: "approved",
        isVerified: true,
        featured: pet.name === "Simba",
        intent: "sale",
      })
      .onConflictDoUpdate({
        target: petListings.slug,
        set: { status: "approved", isVerified: true, intent: "sale", updatedAt: new Date() },
      })
      .returning();
    await db.insert(listingMedia).values([
      { listingId: listing.id, url: pet.species === "Cat" ? "/images/grooming.png" : pet.species === "Small Pet" ? "/images/adoption.png" : "/images/dog.png", type: "image", sortOrder: 0 },
    ]);
  }

  // 7. Community listing awaiting review (demo of moderation flow)
  const [community] = await db
    .insert(petListings)
    .values({
      slug: "bruno-labrador-community",
      listingType: "community",
      ownerId: user1.id,
      name: "Bruno",
      species: "Dog",
      breed: "Labrador",
      gender: "male",
      ageText: "2 years",
      ageMonths: 24,
      price: "3000",
      priceType: "adoption_fee",
      city: "Thane",
      state: "Maharashtra",
      description: "Relocating abroad and looking for a loving home for Bruno. Very affectionate, good with other dogs. Rehoming with his crate and toys.",
      temperament: "Affectionate, social",
      healthInfo: "Neutered, healthy",
      vaccinated: true,
      vaccinationDetails: "Annual vaccines up to date",
      status: "pending_review",
      contactName: "Amit Sharma",
      contactPhone: "+919999999999",
      contactPreference: "platform",
    })
    .onConflictDoUpdate({
      target: petListings.slug,
      set: { status: "pending_review", intent: "adoption", ownerId: user1.id, updatedAt: new Date() },
    })
    .returning();
  await db.insert(listingMedia).values([
    { listingId: community.id, url: "/images/dog.png", type: "image", sortOrder: 0 },
  ]);

  // 8. Hero banners + FAQs
  console.log("🖼️ Seeding banners & FAQs...");
  await db.insert(banners).values([
    {
      title: "Everything your pet needs, in one place.",
      subtitle: "A TRUSTED LOCAL PET-CARE DESTINATION",
      description: "Shop quality products, meet pets from our shop, book grooming services, or find a loving home for a pet.",
      ctaLabel: "Shop Products",
      ctaLink: "/shop",
      placement: "hero",
      sortOrder: 1,
    },
  ]).onConflictDoNothing();

  await db.insert(faqs).values([
    { question: "Are the pets on this site from your shop?", answer: "Pets badged 'Verified by our shop' are physically at our store — you can visit and meet them. Community listings come from individual pet parents and are reviewed by us but not owned by us.", sortOrder: 1 },
    { question: "Is the pet I adopt vaccinated?", answer: "All business pets are vaccinated with age-appropriate schedules and come with a vaccination card. Community listings show vaccination status, but always verify records in person.", sortOrder: 2 },
    { question: "How does listing review work?", answer: "Every community listing is manually reviewed within 24 hours. We check photos, basic health claims and reject anything unsafe or misleading before it goes live.", sortOrder: 3 },
    { question: "Can I cancel a grooming appointment?", answer: "Yes — cancel free of charge up to 3 hours before your slot from your account. Later cancellations may forfeit the deposit.", sortOrder: 4 },
    { question: "What is the delivery time for orders?", answer: "2–3 business days in metro cities, 3–6 days elsewhere. Free delivery on orders above ₹499.", sortOrder: 5 },
    { question: "Do you offer returns?", answer: "7-day returns on unopened products. Opened food and hygiene items can't be returned for safety reasons. Full details in our Refund Policy.", sortOrder: 6 },
  ]).onConflictDoNothing();

  // 9. Blog content (keep original guides)
  console.log("📚 Seeding blog categories & articles...");
  await db.insert(blogCategories).values([
    { name: "Nutrition & Diet", slug: "nutrition-diet" },
    { name: "Grooming & Hygiene", slug: "grooming-hygiene" },
    { name: "Health & Wellness", slug: "health-wellness" },
    { name: "Training & Behaviour", slug: "training-behaviour" },
  ]).onConflictDoNothing();

  const categoriesList = await db.select().from(blogCategories);
  const cat = (slugName: string) => categoriesList.find((c) => c.slug === slugName)?.id;

  const articles = [
    {
      title: "The Ultimate Beagle Puppy Diet Chart & Nutrition Guide",
      slug: "beagle-puppy-diet-chart",
      catSlug: "nutrition-diet",
      excerpt: "Complete breakdown of a Beagle's daily calorie requirements, feeding frequency and top nutrition recommendations.",
      thumbnailUrl: "/images/dog.png",
      content: `<h3>Understanding Beagle Nutritional Needs</h3><p>Beagles are active, energetic and highly food-motivated. Because of their enthusiastic appetite they are prone to obesity — controlled portions are critical for their health and longevity.</p><h4>Puppy Stage (2–6 Months)</h4><p>Feed nutrient-dense food rich in protein (26–28%) and healthy fats, 3 to 4 times a day with high-quality puppy kibble.</p><ul><li><strong>Daily Calories:</strong> ~600–800 kcal</li><li><strong>Feeding Frequency:</strong> 3–4 meals/day</li><li><strong>Meal Portion:</strong> 1/2–3/4 cup per meal</li></ul><h4>Adult Stage (1 Year & Beyond)</h4><p>Transition to adult food at 10–12 months. Feed twice daily to maintain steady energy and avoid bloating or overeating.</p><blockquote><strong>Tip:</strong> Always measure portions. Avoid free-feeding — Beagles will eat until they are sick!</blockquote>`,
    },
    {
      title: "Persian Cat Grooming at Home: A Step-by-Step Walkthrough",
      slug: "persian-cat-grooming-guide",
      catSlug: "grooming-hygiene",
      excerpt: "Learn how to comb, bathe and manage tear staining for your long-haired Persian between salon visits.",
      thumbnailUrl: "/images/grooming.png",
      content: `<h3>Why Persian Cats Need Daily Grooming</h3><p>Their magnificent fur easily mats, tangles and traps dirt. Daily grooming is vital to keep a Persian healthy and comfortable.</p><h4>Step 1: Daily Combing</h4><p>Use a metal comb with wide and fine teeth. Work from head to tail in the direction of hair growth.</p><h4>Step 2: Managing Tear Staining</h4><p>Clean their eyes daily with a warm damp cotton pad or dedicated eye wipes to prevent staining and infection.</p><h4>Step 3: Bathing (Every 4–6 Weeks)</h4><p>Use a soap-free, cat-safe oatmeal shampoo. Dry the coat thoroughly to avoid deep mats.</p>`,
    },
    {
      title: "5 Golden Rules for Crate Training Your Puppy Successfully",
      slug: "crate-training-puppy-rules",
      catSlug: "training-behaviour",
      excerpt: "Transform the crate into a cozy den using positive reinforcement — complete housebreaking instructions included.",
      thumbnailUrl: "/images/hero.png",
      content: `<h3>Crate Training: A Safe Haven, Not a Prison</h3><p>Done correctly, the crate becomes your puppy's cozy den — a secure, stress-free space of their own.</p><h4>Rule 1: Choose the Right Crate Size</h4><p>Large enough to stand up, turn around and lie down comfortably — but not so large they use a corner as a bathroom.</p><h4>Rule 2: Make the Crate Inviting</h4><p>Soft blanket, safe chews, and feed meals inside to build positive association.</p><h4>Rule 3: Never Use the Crate for Punishment</h4><p>Crate-as-punishment creates fear association and destroys training progress.</p>`,
    },
    {
      title: "New Pet-Parent Checklist: The First 30 Days",
      slug: "new-pet-parent-checklist",
      catSlug: "health-wellness",
      excerpt: "Everything to buy, book and decide in your pet's first month — from vet visits to feeding routines.",
      thumbnailUrl: "/images/adoption.png",
      content: `<h3>Week 1: Settle In</h3><p>Keep the environment calm. Stick to the breeder's/shelter's previous food and transition slowly over 7 days to avoid stomach upset.</p><h3>Week 2: Vet & Vaccines</h3><p>Book a wellness check. Confirm the vaccination schedule and deworming dates — keep records in your PawStore pet profile.</p><h3>Week 3: Training Foundations</h3><p>Start name recognition, crate introduction and gentle socialisation after first vaccinations.</p><h3>Week 4: Grooming Routine</h3><p>Introduce brushing and paw-handling early. Book a first grooming session so it becomes routine, not a stressful event.</p>`,
    },
  ];

  for (const a of articles) {
    await db
      .insert(blogs)
      .values({
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        content: a.content,
        categoryId: cat(a.catSlug) ?? null,
        authorId: adminUser.id,
        thumbnailUrl: a.thumbnailUrl,
        readMinutes: 4,
        isPublished: true,
      })
      .onConflictDoNothing();
  }

  console.log("⭐ Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
