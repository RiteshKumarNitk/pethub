import "dotenv/config";
import { db } from "./index";
import { users, products, blogCategories, blogs } from "./schema";

async function main() {
  console.log("🌱 Seeding PawStore database...");

  // 1. Create Super Admin
  const [adminUser] = await db
    .insert(users)
    .values({
      phone: "+911234567890",
      name: "Ritesh (Admin)",
      role: "admin",
    })
    .onConflictDoUpdate({
      target: users.phone,
      set: { role: "admin", name: "Ritesh (Admin)" }
    })
    .returning();

  console.log(`✅ Admin created: ${adminUser.name}`);

  // 2. Create a standard user
  const [user1] = await db
    .insert(users)
    .values({
      phone: "+919999999999",
      name: "Amit Sharma",
      role: "user",
    })
    .onConflictDoUpdate({ target: users.phone, set: { name: "Amit Sharma" } })
    .returning();

  console.log("✅ Standard user created.");

  // 3. Seed premium pet eCommerce products
  console.log("🛒 Seeding premium pet products...");
  await db.delete(products);
  
  await db.insert(products).values([
    {
      name: "Royal Canin Maxi Puppy Kibble (4kg)",
      description: "Premium dry dog food tailored specifically for large breed puppies (adult weight 26-44kg) up to 15 months old. Supports digestive health and natural defences.",
      price: "1599.00",
      category: "Food",
      stock: 50,
      imageUrl: "/images/food.png",
      active: true
    },
    {
      name: "Whiskas Wet Cat Food (Salmon in Gravy) - 12 Pack",
      description: "Delicious wet cat food chunks in gravy for adult cats. Balanced nutrition with zinc and omega-6 for healthy skin and coat.",
      price: "480.00",
      category: "Food",
      stock: 120,
      imageUrl: "/images/food.png",
      active: true
    },
    {
      name: "Premium Retractable Dog Leash (5m)",
      description: "Heavy-duty retractable leash with anti-slip grip and one-handed brake system. Suitable for dogs up to 25kg, length 5 meters.",
      price: "899.00",
      category: "Accessories",
      stock: 35,
      imageUrl: "/images/hero.png",
      active: true
    },
    {
      name: "Orthopedic Memory Foam Pet Bed (Large)",
      description: "Premium joint-relief memory foam bed with a removable, machine-washable ultra-soft cover. Ideal for aging or active pets.",
      price: "3499.00",
      category: "Accessories",
      stock: 15,
      imageUrl: "/images/hero.png",
      active: true
    },
    {
      name: "Organic Aloe Vera Dog Shampoo (500ml)",
      description: "Soap-free, hypoallergenic oatmeal and aloe vera shampoo. Soothes dry, itchy skin and leaves your pup smelling fresh.",
      price: "450.00",
      category: "Care & Hygiene",
      stock: 80,
      imageUrl: "/images/grooming.png",
      active: true
    },
    {
      name: "Self-Cleaning Deshedding Grooming Brush",
      description: "One-click self-cleaning slicker brush for dogs and cats. Gently removes loose undercoat, mats, and tangled hair.",
      price: "599.00",
      category: "Care & Hygiene",
      stock: 60,
      imageUrl: "/images/grooming.png",
      active: true
    },
    {
      name: "Interactive Wobble Treat Dispensing Dog Toy",
      description: "Durable, non-toxic rubber treat dispenser. Keeps dogs mentally stimulated and physically active while slowly dispensing treats.",
      price: "699.00",
      category: "Toys",
      stock: 45,
      imageUrl: "/images/adoption.png",
      active: true
    },
    {
      name: "Cat Feather Teaser Wand & Crinkle Balls Set",
      description: "A fun interactive set containing a flexible wand with feathers, bells, and 5 colorful crinkle balls to keep kittens engaged.",
      price: "349.00",
      category: "Toys",
      stock: 100,
      imageUrl: "/images/adoption.png",
      active: true
    },
    {
      name: "BarkOut Multivitamin Tablets for Dogs (60 Tabs)",
      description: "Vet-approved daily multivitamin supplements containing essential minerals, calcium, and amino acids for immunity, bone, and joint health.",
      price: "799.00",
      category: "Health",
      stock: 75,
      imageUrl: "/images/grooming.png",
      active: true
    },
    {
      name: "Spot-On Tick & Flea Prevention for Small Dogs",
      description: "Fast-acting, long-lasting tick and flea treatment. One application protects your pet against fleas, ticks, and lice for up to 30 days.",
      price: "420.00",
      category: "Health",
      stock: 90,
      imageUrl: "/images/grooming.png",
      active: true
    },
    {
      name: "Durable Nylon chew Toy Bone for Aggressive Chewers",
      description: "Vet-recommended heavy-duty nylon bone for dogs who love to chew. Helps clean teeth and keeps your pup engaged for hours.",
      price: "549.00",
      category: "Toys",
      stock: 65,
      imageUrl: "/images/adoption.png",
      active: true
    },
    {
      name: "Stainless Steel Double Diner Pet Bowls (2 Pack)",
      description: "Premium anti-skid stainless steel bowls with rubber base. Perfect for food and water. Easy to clean and dishwasher safe.",
      price: "699.00",
      category: "Accessories",
      stock: 80,
      imageUrl: "/images/hero.png",
      active: true
    },
    {
      name: "Pet Wipes - Gentle Cleaning (100 Wipes Pack)",
      description: "Aloe vera and vitamin E enriched pet wipes for gentle cleaning of paws, face, and body. Safe for daily use on dogs and cats.",
      price: "299.00",
      category: "Care & Hygiene",
      stock: 200,
      imageUrl: "/images/grooming.png",
      active: true
    },
    {
      name: "Joint Care Chews for Senior Dogs (90 Chews)",
      description: "Advanced glucosamine and chondroitin formula to support hip and joint health in senior dogs. Chicken-flavored soft chews.",
      price: "999.00",
      category: "Health",
      stock: 40,
      imageUrl: "/images/grooming.png",
      active: true
    }
  ]);
  console.log("✅ Pet products seeded.");

  // 4. Seed Blog Categories & Blogs
  console.log("📚 Seeding blog categories & articles...");
  
  await db.insert(blogCategories).values([
     { name: "Nutrition & Diet", slug: "nutrition-diet" },
     { name: "Grooming & Hygiene", slug: "grooming-hygiene" },
     { name: "Health & Wellness", slug: "health-wellness" },
     { name: "Training & Behaviour", slug: "training-behaviour" }
  ]).onConflictDoNothing();

  const categoriesList = await db.select().from(blogCategories);
  const nutritionCat = categoriesList.find(c => c.slug === "nutrition-diet");
  const groomingCat = categoriesList.find(c => c.slug === "grooming-hygiene");
  const healthCat = categoriesList.find(c => c.slug === "health-wellness");
  const trainingCat = categoriesList.find(c => c.slug === "training-behaviour");

  await db.delete(blogs);

  if (nutritionCat && groomingCat && healthCat && trainingCat) {
    await db.insert(blogs).values([
      {
        title: "The Ultimate Beagle Puppy Diet Chart & Nutrition Guide",
        slug: "beagle-puppy-diet-chart",
        content: `<h3>Understanding Beagle Nutritional Needs</h3><p>Beagles are active, energetic, and highly food-motivated dogs. Because of their enthusiastic appetite, Beagles are prone to obesity. Providing a balanced diet with controlled portions is critical for their health and longevity.</p><h4>Puppy Stage (2 to 6 Months)</h4><p>At this stage, your Beagle puppy is growing rapidly and requires nutrient-dense food rich in protein (26-28%) and healthy fats. Feed them 3 to 4 times a day with high-quality puppy kibble.</p><ul><li><strong>Daily Calories:</strong> Approximately 600 - 800 kcal</li><li><strong>Feeding Frequency:</strong> 3-4 meals per day</li><li><strong>Meal Portion:</strong> 1/2 to 3/4 cup per meal</li></ul><h4>Adult Stage (1 Year & Beyond)</h4><p>Transition your Beagle to adult food at around 10-12 months. Adult Beagles should be fed twice a day to maintain steady energy levels and avoid bloating or overeating.</p><blockquote><strong>Tip:</strong> Always measure food portions with a cup. Avoid free-feeding (leaving food out all day) as Beagles will eat until they are sick!</blockquote>`,
        categoryId: nutritionCat.id,
        authorId: adminUser.id,
        thumbnailUrl: "/images/dog.png",
        isPublished: true
      },
      {
        title: "Persian Cat Grooming at Home: A Step-by-Step Walkthrough",
        slug: "persian-cat-grooming-guide",
        content: `<h3>Why Persian Cats Need Daily Grooming</h3><p>With their luxurious long coats, flat faces, and sweet temperaments, Persian cats are beloved worldwide. However, their magnificent fur easily mats, tangles, and traps dirt. Daily grooming is not optional—it is a vital part of keeping a Persian cat healthy and comfortable.</p><h4>Step 1: Daily Combing</h4><p>Use a high-quality metal comb with wide-spaced teeth on one side and fine-spaced teeth on the other. Start from the head and work your way down the back, belly, and legs. Always comb in the direction of hair growth.</p><h4>Step 2: Managing Tear Staining</h4><p>Persian cats often suffer from excessive tear production due to their facial structure. Clean their eyes daily with a cotton pad moistened with warm water or dedicated cat eye wipes to prevent dark brown tear stains and infections.</p><h4>Step 3: Bathing (Every 4-6 Weeks)</h4><p>Bathe your Persian cat in warm water using a soap-free, cat-safe oatmeal shampoo. Make sure to dry their coat thoroughly with a towel or a pet-safe hairdryer on a low-heat setting to avoid deep mats.</p>`,
        categoryId: groomingCat.id,
        authorId: adminUser.id,
        thumbnailUrl: "/images/grooming.png",
        isPublished: true
      },
      {
        title: "5 Golden Rules for Crate Training Your Puppy Successfully",
        slug: "crate-training-puppy-rules",
        content: `<h3>Crate Training: A Safe Haven, Not a Prison</h3><p>Crate training is one of the most effective ways to housebreak your puppy and provide them with a secure, stress-free space of their own. When done correctly, the crate becomes your puppy's cozy den, not a place of punishment.</p><h4>Rule 1: Choose the Right Crate Size</h4><p>The crate should be large enough for your puppy to stand up, turn around, and lie down comfortably. If the crate is too large, they might use one corner as a bathroom and the other as a bed.</p><h4>Rule 2: Make the Crate Inviting</h4><p>Place a soft blanket, safe chew toys, and a treat-dispensing puzzle toy inside. Feed your puppy their meals inside the crate to build a positive association with the space.</p><h4>Rule 3: Never Use the Crate for Punishment</h4><p>If you put your puppy in the crate when they misbehave, they will begin to associate it with fear and isolation, which completely ruins the training progress.</p>`,
        categoryId: trainingCat.id,
        authorId: adminUser.id,
        thumbnailUrl: "/images/hero.png",
        isPublished: true
      },
      {
        title: "How to Identify and Treat Tick Fever in Dogs",
        slug: "tick-fever-dogs-treatment",
        content: `<h3>What is Tick Fever?</h3><p>Tick fever (e.g., Ehrlichiosis, Babesiosis) is a serious, potentially life-threatening infectious disease transmitted to dogs through tick bites. It affects blood platelets and red blood cells, causing severe internal distress if left untreated.</p><h4>Recognizing the Key Symptoms</h4><p>Symptoms can develop weeks after a tick bite and can be subtle initially. Watch out for:</p><ul><li>High fever and lethargy</li><li>Loss of appetite and rapid weight loss</li><li>Swollen lymph nodes and joint pain</li><li>Spontaneous bleeding (nosebleeds, blood in urine/stool)</li><li>Pale gums (anemia)</li></ul><h4>Medical Diagnosis & Treatment</h4><p>If you suspect tick fever, consult a vet immediately. They will perform a blood test (CBC and PCR test) to check platelet levels and identify the pathogen. Treatment typically includes a 3-to-4 week course of antibiotics (like Doxycycline), alongside multivitamins and iron supplements to aid blood recovery.</p><blockquote><strong>Prevention is Key:</strong> Use monthly tick-and-flea spot-on treatments, tick collars, or oral chewables, especially during warm and humid monsoon seasons.</blockquote>`,
        categoryId: healthCat.id,
        authorId: adminUser.id,
        thumbnailUrl: "/images/dog.png",
        isPublished: true
      }
    ]);
  }
  console.log("✅ Care guide blogs seeded.");

  console.log("⭐ Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
