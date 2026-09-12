import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings, SiteSettings } from "@/lib/settings";
import { logAudit } from "@/lib/utils";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();

    // Whitelist fields
    const allowed: (keyof SiteSettings)[] = [
      "storeName", "tagline", "storeEmail", "storePhone", "whatsappNumber", "storeAddress",
      "storeHours", "instagramUrl", "facebookUrl", "shippingFee", "freeShippingAbove",
      "taxPercent", "bookingSlotMinutes", "bookingOpenTime", "bookingCloseTime",
      "bookingMinLeadHours", "bookingMaxAdvanceDays", "listingModerationNotice",
    ];

    const patch: Partial<SiteSettings> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        (patch as Record<string, unknown>)[key] = body[key];
      }
    }

    const settings = await updateSettings(patch);
    await logAudit(adminId, "settings.update", "site_settings", undefined, patch);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Admin settings PUT error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
