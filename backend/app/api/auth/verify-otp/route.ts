import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { otps, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { createToken, setAuthCookie } from "@/lib/auth";
import { findOrCreateUser } from "@/lib/user";
import { checkRateLimit } from "@/lib/rate-limiter";

const MAX_VERIFY_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const { phone, otp, name } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    const rateCheck = checkRateLimit(`verify:${normalizedPhone}`, 10, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const [stored] = await db
      .select()
      .from(otps)
      .where(eq(otps.phone, normalizedPhone))
      .limit(1);

    if (!stored) {
      return NextResponse.json({ error: "No OTP requested. Please request a new code." }, { status: 401 });
    }

    if (new Date(stored.expiresAt) < new Date()) {
      await db.delete(otps).where(eq(otps.phone, normalizedPhone));
      return NextResponse.json({ error: "OTP expired. Please request a new code." }, { status: 401 });
    }

    if (stored.attempts >= MAX_VERIFY_ATTEMPTS) {
      await db.delete(otps).where(eq(otps.phone, normalizedPhone));
      return NextResponse.json({ error: "Too many incorrect attempts. Request a new OTP." }, { status: 429 });
    }

    if (stored.otp !== String(otp).trim()) {
      await db
        .update(otps)
        .set({ attempts: stored.attempts + 1 })
        .where(eq(otps.id, stored.id));
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    // OTP is correct — clean up
    await db.delete(otps).where(eq(otps.id, stored.id));

    const user = await findOrCreateUser(normalizedPhone, name || stored.name || undefined);

    if (user.isBlocked) {
      return NextResponse.json({ error: "This account has been suspended. Contact support." }, { status: 403 });
    }

    const token = await createToken({
      userId: user.id,
      phone: user.phone,
      role: user.role as "user" | "admin",
    });

    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
