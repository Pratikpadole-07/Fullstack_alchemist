import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client.js";
import Loader from "../components/Loader.jsx";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Razorpay script failed"));
    document.body.appendChild(s);
  });
}

export default function PaymentPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payState, setPayState] = useState("");
  const [orderPayload, setOrderPayload] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get(`/events/${eventId}`);
        setEvent(data.event);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const startCheckout = async () => {
    setError("");
    setPayState("Creating order…");
    try {
      const { data } = await client.post("/payments/create-order", { eventId });
      setOrderPayload(data);
      setPayState("");

      if (data.mock || !data.key) {
        setPayState("Demo mode: simulating successful payment…");
        await client.post("/payments/verify", {
          paymentId: data.paymentId,
          razorpay_order_id: data.orderId,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: "",
        });
        setPayState("Funds held in escrow (simulated). Safe until the event completes.");
        return;
      }

      await loadRazorpayScript();
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency || "INR",
        order_id: data.orderId,
        name: "TrustEvents",
        description: event?.title || "Tickets",
        handler: async function (response) {
          try {
            setPayState("Verifying payment…");
            await client.post("/payments/verify", {
              paymentId: data.paymentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPayState("Payment verified. Funds held in escrow until event completion.");
          } catch (e) {
            setError(e.response?.data?.message || "Verification failed");
          }
        },
        theme: { color: "#3b82f6" },
      };
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Payment start failed");
      setPayState("");
    }
  };

  if (loading) return <Loader />;
  if (!event) return <p className="error container">{error || "Not found"}</p>;

  return (
    <div className="container stack" style={{ maxWidth: 560 }}>
      <Link to={`/events/${eventId}`}>← Event</Link>
      <div className="card stack">
        <h2>Escrow checkout</h2>
        <p className="muted" style={{ margin: 0 }}>
          Your payment is captured into a hold. After the event is marked complete, admins (or RazorpayX Escrow automation)
          release funds to the organizer. Cancellations and fraud findings trigger refunds.
        </p>
        <p style={{ fontWeight: 700 }}>{event.title}</p>
        <p>Amount: ₹{event.price}</p>
        {orderPayload && !orderPayload.mock && orderPayload.key && (
          <p className="muted" style={{ margin: 0 }}>
            Order <code>{orderPayload.orderId}</code>
          </p>
        )}
        {error && <p className="error">{error}</p>}
        {payState && <p className="muted">{payState}</p>}
        <button type="button" className="btn" onClick={startCheckout}>
          Pay with Razorpay
        </button>
      </div>
    </div>
  );
}
