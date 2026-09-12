export async function sendOTP(phone: string, otp: string) {
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      await client.messages.create({
        body: `Your PawStore OTP is: ${otp}`,
        from: process.env.TWILIO_FROM_NUMBER,
        to: phone,
      });
    }
  } catch (err: any) {
    console.error(`[SMS Error] Twilio failed: ${err.message}`);
  }

  try {
    if (process.env.MSG91_API_KEY) {
      const https = require("https");
      const data = JSON.stringify({
        authkey: process.env.MSG91_API_KEY,
        mobiles: phone.replace("+", ""),
        message: `Your PawStore OTP is: ${otp}`,
        sender: "PETHUB",
      });
      
      const options = {
        hostname: "api.msg91.com",
        port: 443,
        path: "/api/sendhttp.php",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      };
      
      await new Promise((resolve, reject) => {
        const req = https.request(options, (res: any) => {
          let responseData = "";
          res.on("data", (chunk: string) => (responseData += chunk));
          res.on("end", () => resolve(responseData));
        });
        req.on("error", reject);
        req.write(data);
        req.end();
      });
    }
  } catch (err: any) {
    console.error(`[SMS Error] MSG91 failed: ${err.message}`);
  }
  
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  }
  
  return { sid: `dev_${Date.now()}` };
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
