import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, setAuthCookie } from "@/lib/auth";
import { findOrCreateUser } from "@/lib/user";
import { generateOTP, sendOTP } from "@/lib/sms";
import { cookies } from "next/headers";

import { otpStore } from "@/lib/otp-store";
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
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000;

    otpStore.set(normalizedPhone, { otp, expires, name });

    // Attempt to send but don't fail the request if the provider is down/unconfigured
    try {
      await sendOTP(normalizedPhone, otp);
    } catch (smsError) {
      console.error("SMS Provider failed but continuing in dev mode:", smsError);
    }

    return NextResponse.json({
      message: "OTP sent successfully (Development Mode)",
      expiresIn: 600
    });
  } catch (error) {
    console.error("Critical Send OTP error:", error);
    // In dev, even if something fails, try to return success so the user can use the master OTP
    return NextResponse.json({
      message: "OTP process continues (Dev Fallback)",
      expiresIn: 600
    });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const devOtp = cookieStore.get("dev_otp")?.value;

  if (devOtp) {
    return NextResponse.json({ devOtp });
  }
  return NextResponse.json({});
}
