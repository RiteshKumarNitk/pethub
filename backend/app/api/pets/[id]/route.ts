import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pets, vaccinations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const petId = parseInt(id);
    const userId = parseInt(request.headers.get("x-user-id")!);
    
    const pet = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);
    
    if (!pet.length) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }
    
    if (pet[0].userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const petVaccinations = await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.petId, petId));
    
    return NextResponse.json({
      pet: pet[0],
      vaccinations: petVaccinations,
    });
  } catch (error) {
    console.error("Get pet error:", error);
    return NextResponse.json({ error: "Failed to fetch pet" }, { status: 500 });
  }
}
