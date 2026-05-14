import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pets, vaccinations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    
    const userPets = await db.select().from(pets).where(eq(pets.userId, userId));
    
    return NextResponse.json({ pets: userPets });
  } catch (error) {
    console.error("Get pets error:", error);
    return NextResponse.json({ error: "Failed to fetch pets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    
    const { name, breed, dob, photoUrl, notes } = body;
    
    if (!name) {
      return NextResponse.json({ error: "Pet name is required" }, { status: 400 });
    }
    
    const [newPet] = await db.insert(pets).values({
      userId,
      name,
      breed,
      dob,
      photoUrl,
      notes,
    }).returning();
    
    return NextResponse.json({ pet: newPet }, { status: 201 });
  } catch (error) {
    console.error("Create pet error:", error);
    return NextResponse.json({ error: "Failed to create pet" }, { status: 500 });
  }
}
