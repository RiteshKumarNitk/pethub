import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

    return NextResponse.json({ addresses: userAddresses });
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { label, street, city, state, zip, isDefault } = body;

    if (!street || !city || !state || !zip) {
      return NextResponse.json({ error: "Street, city, state, and zip are required" }, { status: 400 });
    }

    if (isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userId));
    }

    const [address] = await db
      .insert(addresses)
      .values({
        userId,
        label: label || "Home",
        street,
        city,
        state,
        zip,
        isDefault: isDefault || false,
      })
      .returning();

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}
