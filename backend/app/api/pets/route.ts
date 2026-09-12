import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPets = await db
      .select()
      .from(pets)
      .where(eq(pets.userId, userId))
      .orderBy(desc(pets.createdAt));

    return NextResponse.json({ pets: userPets });
  } catch (error) {
    console.error("Get pets error:", error);
    return NextResponse.json({ error: "Failed to fetch pets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, species, breed, gender, birthDate, ageYears, weightKg, imageUrl, vaccinations, medicalNotes, groomerNotes } = body;

    if (!name || !species) {
      return NextResponse.json({ error: "Name and species are required" }, { status: 400 });
    }

    const [pet] = await db
      .insert(pets)
      .values({
        userId,
        name,
        species,
        breed: breed || null,
        gender: gender || null,
        birthDate: birthDate || null,
        ageYears: ageYears ? parseInt(ageYears) : null,
        weightKg: weightKg ? String(weightKg) : null,
        imageUrl: imageUrl || null,
        vaccinations: Array.isArray(vaccinations) ? vaccinations : [],
        medicalNotes: medicalNotes || null,
        groomerNotes: groomerNotes || null,
      })
      .returning();

    return NextResponse.json({ pet }, { status: 201 });
  } catch (error) {
    console.error("Create pet error:", error);
    return NextResponse.json({ error: "Failed to create pet" }, { status: 500 });
  }
}
