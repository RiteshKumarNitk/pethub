import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { petListings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    
    let query;
    if (source) {
      query = db
        .select()
        .from(petListings)
        .where(eq(petListings.isApproved, "true"))
        .orderBy(desc(petListings.createdAt));
      
      if (source === "shop") {
        query = db
          .select()
          .from(petListings)
          .where(eq(petListings.source, "shop"))
          .orderBy(desc(petListings.createdAt));
      } else if (source === "user") {
        query = db
          .select()
          .from(petListings)
          .where(eq(petListings.source, "user"))
          .orderBy(desc(petListings.createdAt));
      }
    } else {
      query = db
        .select()
        .from(petListings)
        .where(eq(petListings.isApproved, "true"))
        .orderBy(desc(petListings.createdAt));
    }
    
    const listings = await query;
    
    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Get listings error:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    
    const { breed, ageMonths, price, description, contactPhone, images } = body;
    
    if (!breed || !ageMonths || !price || !contactPhone) {
      return NextResponse.json(
        { error: "Breed, age, price, and contact phone are required" },
        { status: 400 }
      );
    }
    
    const [newListing] = await db
      .insert(petListings)
      .values({
        userId,
        source: "user",
        breed,
        ageMonths,
        price,
        description,
        contactPhone,
        images,
        isApproved: "false",
      })
      .returning();
    
    return NextResponse.json({ 
      listing: newListing,
      message: "Listing submitted for review"
    }, { status: 201 });
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
