import "dotenv/config";
import { db } from "./index";
import {
  users, products, categories, brands, blogCategories, blogs,
  services, petListings, listingMedia, banners, faqs,
} from "./schema";

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

  // 2. Categories
  console.log("🗂️ Seeding categories...");
  const categoryData = [
    { name: "Dog Food", petType: "dog", sortOrder: 1 },
    { name: "Cat Food", petType: "cat", sortOrder: 2 },
    { name: "Treats", petType: "all", sortOrder: 3 },
    { name: "Toys", petType: "all", sortOrder: 4 },
    { name: "Grooming", petType: "all", sortOrder: 5 },
    { name: "Health & Hygiene", petType: "all", sortOrder: 6 },
    { name: "Beds & Furniture", petType: "all", sortOrder: 7 },
    { name: "Collars & Leashes", petType: "dog", sortOrder: 8 },
    { name: "Litter", petType: "cat", sortOrder: 9 },
    { name: "Accessories", petType: "all", sortOrder: 10 },
  ];
  for (const c of categoryData) {
    await db.insert(categories).values({ ...c, slug: slugify(c.name) }).onConflictDoNothing();
  }
  const cats = await db.select().from(categories);
  const catByName = Object.fromEntries(cats.map((c) => [c.name, c]));

  // 3. Brands
  console.log("🏷️ Seeding brands...");
  const brandNames = ["Royal Canin", "Whiskas", "Pedigree", "Trixie", "KONG", "Orijen", "Hills", "Farmina", "Drools"];
  for (const name of brandNames) {
    await db.insert(brands).values({ name, slug: slugify(name) }).onConflictDoNothing();
  }
  const brandRows = await db.select().from(brands);
  const brandByName = Object.fromEntries(brandRows.map((b) => [b.name, b]));

  // 4. Products (upgrade existing seed products with slug/category/brand/mrp)
  console.log("🛒 Seeding products...");
  const productData = [
    { name: "Royal Canin Maxi Puppy Kibble (4kg)", price: "1599.00", mrp: "1999.00", brand: "Royal Canin", cat: "Dog Food", petType: "dog", stock: 50, featured: true, bestSeller: true, imageUrl: "/images/food.png", description: "Premium dry dog food tailored for large breed puppies (adult weight 26-44kg) up to 15 months. Supports digestive health and natural defences." },
    { name: "Whiskas Wet Cat Food (Salmon in Gravy) - 12 Pack", price: "480.00", mrp: "599.00", brand: "Whiskas", cat: "Cat Food", petType: "cat", stock: 120, featured: true, bestSeller: true, imageUrl: "/images/food.png", description: "Delicious wet cat food chunks in gravy for adult cats. Balanced nutrition with zinc and omega-6 for healthy skin and coat." },
    { name: "Premium Retractable Dog Leash (5m)", price: "899.00", mrp: "1199.00", brand: "Trixie", cat: "Collars & Leashes", petType: "dog", stock: 35, featured: true, bestSeller: false, imageUrl: "/images/hero.png", description: "Heavy-duty retractable leash with anti-slip grip and one-handed brake system. Suitable for dogs up to 25kg." },
    { name: "Orthopedic Memory Foam Pet Bed (Large)", price: "3499.00", mrp: "4499.00", brand: "Trixie", cat: "Beds & Furniture", petType: "all", stock: 15, featured: true, bestSeller: true, imageUrl: "/images/hero.png", description: "Joint-relief memory foam bed with removable, machine-washable ultra-soft cover. Ideal for aging or active pets." },
    { name: "Organic Aloe Vera Dog Shampoo (500ml)", price: "450.00", mrp: "599.00", brand: "Drools", cat: "Grooming", petType: "dog", stock: 80, featured: true, bestSeller: true, imageUrl: "/images/grooming.png", description: "Soap-free, hypoallergenic oatmeal and aloe vera shampoo. Soothes dry, itchy skin and leaves your pup smelling fresh." },
    { name: "Self-Cleaning Deshedding Grooming Brush", price: "599.00", mrp: "799.00", brand: "Trixie", cat: "Grooming", petType: "all", stock: 60, featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "One-click self-cleaning slicker brush for dogs and cats. Gently removes loose undercoat, mats, and tangled hair." },
    { name: "Interactive Wobble Treat Dispensing Dog Toy", price: "699.00", mrp: "899.00", brand: "KONG", cat: "Toys", petType: "dog", stock: 45, featured: true, bestSeller: true, imageUrl: "/images/adoption.png", description: "Durable, non-toxic rubber treat dispenser. Keeps dogs mentally stimulated and physically active." },
    { name: "Cat Feather Teaser Wand & Crinkle Balls Set", price: "349.00", mrp: "449.00", brand: "Trixie", cat: "Toys", petType: "cat", stock: 100, featured: false, bestSeller: true, imageUrl: "/images/adoption.png", description: "Flexible wand with feathers, bells, and 5 colorful crinkle balls to keep kittens engaged." },
    { name: "BarkOut Multivitamin Tablets for Dogs (60 Tabs)", price: "799.00", mrp: "999.00", brand: "Drools", cat: "Health & Hygiene", petType: "dog", stock: 75, featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "Vet-approved daily multivitamin supplements with essential minerals, calcium, and amino acids for immunity, bone, and joint health." },
    { name: "Spot-On Tick & Flea Prevention for Small Dogs", price: "420.00", mrp: "520.00", brand: "Drools", cat: "Health & Hygiene", petType: "dog", stock: 90, featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "Fast-acting, long-lasting tick and flea treatment. One application protects for up to 30 days." },
    { name: "Durable Nylon Chew Toy Bone for Aggressive Chewers", price: "549.00", mrp: "699.00", brand: "KONG", cat: "Toys", petType: "dog", stock: 65, featured: false, bestSeller: true, imageUrl: "/images/adoption.png", description: "Heavy-duty nylon bone for dogs who love to chew. Helps clean teeth and keeps your pup engaged for hours." },
    { name: "Stainless Steel Double Diner Pet Bowls (2 Pack)", price: "699.00", mrp: "899.00", brand: "Trixie", cat: "Accessories", petType: "all", stock: 80, featured: false, bestSeller: true, imageUrl: "/images/hero.png", description: "Anti-skid stainless steel bowls with rubber base. Perfect for food and water. Dishwasher safe." },
    { name: "Pet Wipes - Gentle Cleaning (100 Wipes Pack)", price: "299.00", mrp: "399.00", brand: "Drools", cat: "Grooming", petType: "all", stock: 200, featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "Aloe vera and vitamin E enriched wipes for gentle cleaning of paws, face, and body. Safe for daily use." },
    { name: "Joint Care Chews for Senior Dogs (90 Chews)", price: "999.00", mrp: "1299.00", brand: "Hills", cat: "Health & Hygiene", petType: "dog", stock: 40, featured: false, bestSeller: true, imageUrl: "/images/grooming.png", description: "Advanced glucosamine and chondroitin formula supporting hip and joint health in senior dogs. Chicken-flavored soft chews." },
    { name: "Clumping Cat Litter - Lavender Scent (10kg)", price: "749.00", mrp: "899.00", brand: "Drools", cat: "Litter", petType: "cat", stock: 55, featured: true, bestSeller: true, imageUrl: "/images/food.png", description: "Superior clumping cat litter with odor control. Low dust, long lasting, easy to scoop." },
    { name: "Chicken Liver Training Treats for Dogs (200g)", price: "249.00", mrp: "329.00", brand: "Drools", cat: "Treats", petType: "dog", stock: 150, featured: true, bestSeller: true, imageUrl: "/images/food.png", description: "High-value soft training treats made with real chicken liver. No artificial colors or preservatives." },
  ];

  for (const p of productData) {
    await db
      .insert(products)
      .values({
        slug: slugify(p.name),
        name: p.name,
        description: p.description,
        shortDescription: p.description.slice(0, 120),
        price: p.price,
        mrp: p.mrp,
        categoryId: catByName[p.cat]?.id ?? null,
        brandId: brandByName[p.brand]?.id ?? null,
        petType: p.petType,
        stock: p.stock,
        lowStockThreshold: 5,
        imageUrl: p.imageUrl,
        isFeatured: p.featured,
        isBestSeller: p.bestSeller,
        active: true,
      })
      .onConflictDoNothing();
  }
  console.log("✅ Products seeded.");

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
