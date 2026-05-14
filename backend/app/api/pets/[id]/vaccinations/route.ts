import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pets, vaccinations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
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
    
    const { vaccineName, dateGiven, nextDue } = await request.json();
    
    if (!vaccineName || !dateGiven) {
      return NextResponse.json(
        { error: "Vaccine name and date are required" },
        { status: 400 }
      );
    }
    
    const [newVaccination] = await db
      .insert(vaccinations)
      .values({
        petId,
        vaccineName,
        dateGiven,
        nextDue,
      })
      .returning();
    
    return NextResponse.json({ vaccination: newVaccination }, { status: 201 });
  } catch (error) {
    console.error("Add vaccination error:", error);
    return NextResponse.json({ error: "Failed to add vaccination" }, { status: 500 });
  }
}
