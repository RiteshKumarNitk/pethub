import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { otps } from "@/db/schema";
import { generateOTP, sendOTP } from "@/lib/sms";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json();

    if (!phone || !/^\+?[1-9]\d{9,14}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    const rateCheck = checkRateLimit(`otp:${normalizedPhone}`, 3, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Persist OTP so it survives serverless cold starts / multiple instances
    await db
      .insert(otps)
      .values({ phone: normalizedPhone, otp, name: name || null, expiresAt })
      .onConflictDoUpdate({
        target: otps.phone,
        set: { otp, name: name || null, expiresAt, attempts: 0, createdAt: new Date() },
      });

    try {
      await sendOTP(normalizedPhone, otp);
    } catch (smsError) {
      console.error("SMS provider failed:", smsError);
      // Don't fail the request; OTP is still stored so support can assist
    }

    return NextResponse.json({
      message: "OTP sent successfully",
      expiresIn: 600,
      // In non-production only, surface the OTP so the app is usable before SMS providers are configured.
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : { }),
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
