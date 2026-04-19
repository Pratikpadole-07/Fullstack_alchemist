/**
 * Escrow-style hold/release simulation in MongoDB.
 * Production: plug RazorpayX Escrow / linked account payouts here
 * (capture/settlement APIs) while keeping the same status machine:
 * pending -> held -> released | refunded
 */
export function buildEscrowMeta({ phase, note }) {
  return {
    mode: process.env.RAZORPAY_KEY_ID ? "razorpay_ready" : "demo_simulated",
    phase: phase || "init",
    note: note || "",
    updatedAt: new Date().toISOString(),
  };
}
