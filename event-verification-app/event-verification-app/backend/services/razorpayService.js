import Razorpay from "razorpay";
import crypto from "crypto";

let client = null;

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getClient() {
  if (!isRazorpayConfigured()) return null;
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

/** Amount in smallest currency unit (paise for INR). */
export async function createOrder(amountPaise, receipt) {
  const rz = getClient();
  if (!rz) {
    return {
      mock: true,
      id: `order_demo_${Date.now()}`,
      amount: amountPaise,
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
    };
  }
  const order = await rz.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: receipt || `rcpt_${Date.now()}`,
  });
  return { mock: false, ...order };
}

export function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!isRazorpayConfigured()) {
    return true;
  }
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === signature;
}
