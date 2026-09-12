import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, ne, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.slug, slug), eq(services.active, true)))
      .limit(1);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const otherServices = await db
      .select({
        id: services.id,
        slug: services.slug,
        name: services.name,
        price: services.price,
        imageUrl: services.imageUrl,
        durationMinutes: services.durationMinutes,
      })
      .from(services)
      .where(and(eq(services.active, true), ne(services.id, service.id)))
      .limit(4);

    return NextResponse.json({ service, otherServices });
  } catch (error) {
    console.error("Service detail error:", error);
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 });
  }
}
