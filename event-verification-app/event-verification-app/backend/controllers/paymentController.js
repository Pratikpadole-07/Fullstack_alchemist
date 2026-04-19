import Payment from "../models/Payment.js";
import Refund from "../models/Refund.js";
import Event from "../models/Event.js";
import Organizer from "../models/Organizer.js";
import { createOrder, verifyPaymentSignature, isRazorpayConfigured } from "../services/razorpayService.js";
import { buildEscrowMeta } from "../services/escrowService.js";
import { notifyEmailStub, notifyWebhookStub } from "../services/notificationService.js";

function paise(amountInr) {
  return Math.round(Number(amountInr) * 100);
}

export async function createOrderHandler(req, res) {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!["approved"].includes(event.status)) {
      return res.status(400).json({ message: "Event not open for booking" });
    }
    const amountPaise = paise(event.price);
    const order = await createOrder(amountPaise, `evt_${event._id}`);

    const payment = await Payment.create({
      eventId: event._id,
      userId: req.user?.sub || "demoUser",
      amount: event.price,
      status: "pending",
      razorpayOrderId: order.id,
      escrowMeta: buildEscrowMeta({ phase: "order_created", note: order.mock ? "demo_order" : "razorpay_order" }),
    });

    await notifyWebhookStub("payment.order_created", { paymentId: payment._id, orderId: order.id });

    return res.json({
      orderId: order.id,
      amount: order.amount ?? amountPaise,
      currency: order.currency || "INR",
      key: isRazorpayConfigured() ? process.env.RAZORPAY_KEY_ID : "",
      mock: Boolean(order.mock),
      paymentId: payment._id,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Order creation failed" });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !paymentId) {
      return res.status(400).json({ message: "Missing payment fields" });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || String(payment.userId) !== String(req.user.sub)) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const ok =
      !isRazorpayConfigured() ||
      (razorpay_signature && verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature));
    if (!ok) return res.status(400).json({ message: "Invalid signature" });

    payment.status = "held";
    payment.razorpayOrderId = razorpay_order_id;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature || "";
    payment.escrowMeta = buildEscrowMeta({
      phase: "funds_held",
      note: "Simulated escrow hold — swap for RazorpayX Escrow settlement",
    });
    await payment.save();

    await notifyEmailStub({
      to: req.user.email,
      subject: "Ticket secured (escrow hold)",
      body: `Payment ${payment._id} is held until the event completes.`,
    });

    return res.json({ payment, message: "Payment verified and held in escrow (simulated)" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Verify failed" });
  }
}

export async function holdPayment(req, res) {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Not found" });
    if (String(payment.userId) !== String(req.user.sub) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    payment.status = "held";
    payment.escrowMeta = buildEscrowMeta({ phase: "manual_hold", note: "demo_hold" });
    await payment.save();
    return res.json({ payment });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Hold failed" });
  }
}

export async function releasePayment(req, res) {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findById(paymentId).populate("eventId");
    if (!payment) return res.status(404).json({ message: "Not found" });
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

    const ev = payment.eventId;
    if (!ev || ev.status !== "completed") {
      return res.status(400).json({ message: "Event must be completed before release" });
    }
    if (payment.status !== "held") {
      return res.status(400).json({ message: "Payment not in held state" });
    }

    payment.status = "released";
    payment.escrowMeta = buildEscrowMeta({
      phase: "payout_released",
      note: "Replace with RazorpayX linked account transfer / settlements API",
    });
    await payment.save();

    const org = await Organizer.findById(ev.organizerId);
    if (org) {
      org.pastSuccessfulEvents = (org.pastSuccessfulEvents || 0) + 1;
      await org.save();
    }

    await notifyWebhookStub("payment.released", { paymentId: payment._id });
    return res.json({ payment });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Release failed" });
  }
}

export async function refundPayment(req, res) {
  try {
    const { paymentId, reason } = req.body;
    if (!paymentId || !reason) return res.status(400).json({ message: "paymentId and reason required" });
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Not found" });
    if (!["held", "pending"].includes(payment.status)) {
      return res.status(400).json({ message: "Cannot refund this payment state" });
    }

    const refund = await Refund.create({ paymentId: payment._id, reason, status: "processed" });
    payment.status = "refunded";
    payment.escrowMeta = buildEscrowMeta({
      phase: "refunded",
      note: "Use Razorpay refunds API in production",
    });
    await payment.save();

    await notifyEmailStub({
      to: "user@example.com",
      subject: "Refund processed (stub)",
      body: `Refund for payment ${payment._id}: ${reason}`,
    });

    return res.json({ payment, refund });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Refund failed" });
  }
}
