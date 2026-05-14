import "dotenv/config";
import { db } from "./index";
import { users, petListings, pets } from "./schema";

async function main() {
  console.log("🌱 Seeding database with natural data...");

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

  // 2. Create standard users
  const [user1] = await db
    .insert(users)
    .values({
      phone: "+919999999999",
      name: "Amit Sharma",
      role: "user",
    })
    .onConflictDoUpdate({ target: users.phone, set: { name: "Amit Sharma" } })
    .returning();

  const [user2] = await db
    .insert(users)
    .values({
      phone: "+918888888888",
      name: "Sneha Patil",
      role: "user",
    })
    .onConflictDoUpdate({ target: users.phone, set: { name: "Sneha Patil" } })
    .returning();

  console.log("✅ Standard users created.");

  // 3. Create Pet Listings (Approved & Pending)
  await db.insert(petListings).values([
    {
      userId: user1.id,
      breed: "Golden Retriever",
      ageMonths: 2,
      price: "45000",
      description: "Playful and healthy Golden Retriever puppy looking for a warm home. Vaccination started.",
      contactPhone: user1.phone,
      isApproved: "true",
      images: ["/images/dog.png"],
    },
    {
      userId: user2.id,
      breed: "Persian Kitten",
      ageMonths: 3,
      price: "15000",
      description: "White Persian kitten with blue eyes. Litter trained and very friendly with kids.",
      contactPhone: user2.phone,
      isApproved: "true",
      images: ["/images/adoption.png"],
    },
    {
      userId: adminUser.id,
      breed: "Beagle",
      ageMonths: 4,
      price: "25000",
      description: "Trained Beagle puppy. Very energetic and great for active families.",
      contactPhone: adminUser.phone,
      isApproved: "false", // Pending approval
      images: ["/images/hero.png"],
    },
  ]);

  console.log("✅ Pet listings seeded.");

  // 4. Create Pets (for User Dashboard)
  await db.insert(pets).values([
    {
      userId: user1.id,
      name: "Max",
      breed: "Labrador",
      dob: "2023-10-12",
      notes: "Likes peanut butter. Afraid of thunder.",
    },
    {
      userId: user2.id,
      name: "Bella",
      breed: "Siamese Cat",
      dob: "2024-01-05",
      notes: "Very vocal. Loves windows.",
    }
  ]);

  console.log("✅ User pets seeded.");
  console.log("⭐ Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
