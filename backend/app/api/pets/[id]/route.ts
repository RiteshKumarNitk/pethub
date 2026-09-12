import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pets } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const petId = parseInt(id);
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, petId), eq(pets.userId, userId)))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, species, breed, gender, birthDate, ageYears, weightKg, imageUrl, vaccinations, medicalNotes, groomerNotes } = body;

    const [updated] = await db
      .update(pets)
      .set({
        name: name || existing[0].name,
        species: species || existing[0].species,
        breed: breed !== undefined ? breed : existing[0].breed,
        gender: gender !== undefined ? gender : existing[0].gender,
        birthDate: birthDate !== undefined ? birthDate : existing[0].birthDate,
        ageYears: ageYears !== undefined ? (ageYears ? parseInt(ageYears) : null) : existing[0].ageYears,
        weightKg: weightKg !== undefined ? (weightKg ? String(weightKg) : null) : existing[0].weightKg,
        imageUrl: imageUrl !== undefined ? imageUrl : existing[0].imageUrl,
        vaccinations: vaccinations !== undefined ? vaccinations : existing[0].vaccinations,
        medicalNotes: medicalNotes !== undefined ? medicalNotes : existing[0].medicalNotes,
        groomerNotes: groomerNotes !== undefined ? groomerNotes : existing[0].groomerNotes,
        updatedAt: new Date(),
      })
      .where(eq(pets.id, petId))
      .returning();

    return NextResponse.json({ pet: updated });
  } catch (error) {
    console.error("Update pet error:", error);
    return NextResponse.json({ error: "Failed to update pet" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const petId = parseInt(id);
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, petId), eq(pets.userId, userId)))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    await db.delete(pets).where(eq(pets.id, petId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete pet error:", error);
    return NextResponse.json({ error: "Failed to delete pet" }, { status: 500 });
  }
}
