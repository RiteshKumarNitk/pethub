import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function findOrCreateUser(phone: string, name?: string) {
  const existing = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  const [newUser] = await db.insert(users).values({ phone, name }).returning();
  return newUser;
}

export async function getUserById(id: number) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}
