import Razorpay from "razorpay";

let _client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!_client) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }
    _client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _client;
}

export async function createRazorpayOrder(amount: number, receipt: string) {
  return getClient().orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt,
  });
}

export function verifyPaymentSignature(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const crypto = require("crypto");
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
    .digest("hex");

  return generatedSignature === data.razorpay_signature;
}
