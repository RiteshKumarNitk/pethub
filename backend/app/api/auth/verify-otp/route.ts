import { NextRequest, NextResponse } from "next/server";
import { findOrCreateUser } from "@/lib/user";
import { createToken, setAuthCookie } from "@/lib/auth";

import { otpStore } from "@/lib/otp-store";

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();
    
    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });
    }
    
    const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    const stored = otpStore.get(normalizedPhone);
    
    // Master OTP bypass for development
    const isMasterOtp = otp === "123456";
    
    if (!isMasterOtp && (!stored || stored.otp !== otp || Date.now() > stored.expires)) {
      console.log(`[AUTH] Failed verification for ${normalizedPhone}. Received: ${otp}, Stored: ${stored?.otp}`);
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }
    
    const storedName = stored?.name;
    otpStore.delete(normalizedPhone);
    
    const user = await findOrCreateUser(normalizedPhone, storedName);
    const token = await createToken({
      userId: user.id,
      phone: user.phone,
      role: user.role as "user" | "admin",
    });
    
    await setAuthCookie(token);
    
    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
