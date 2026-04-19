import { useEffect, useState } from "react";
import client from "../api/client.js";
import Loader from "../components/Loader.jsx";
import StatusPill from "../components/StatusPill.jsx";

export default function AdminReview() {
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const [rev, pay] = await Promise.all([client.get("/admin/reviews"), client.get("/admin/payments")]);
      setItems(rev.data.items || []);
      setPayments(pay.data.payments || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const decide = async (id, decision) => {
    await client.post(`/admin/reviews/${id}/decision`, { decision, comments: "admin panel" });
    refresh();
  };

  const complete = async (eventId) => {
    await client.post("/admin/events/complete", { eventId });
    refresh();
  };

  const cancel = async (eventId) => {
    await client.post("/admin/events/cancel", { eventId });
    refresh();
  };

  const release = async (paymentId) => {
    await client.post("/payments/release", { paymentId });
    refresh();
  };

  const refund = async (paymentId) => {
    await client.post("/payments/refund", { paymentId, reason: "admin refund demo" });
    refresh();
  };

  if (loading) return <Loader />;

  return (
    <div className="container stack">
      <h1>Admin · Event reviews</h1>
      {error && <p className="error">{error}</p>}

      <div className="grid cards">
        {items.map(({ event, aiRisk }) => (
          <div key={event._id} className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{event.title}</h3>
              <StatusPill status={event.status} />
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Trust {event.trustScore}
            </p>
            <p style={{ margin: 0 }}>{aiRisk}</p>
            <div className="row">
              <button type="button" className="btn success" onClick={() => decide(event._id, "approved")}>
                Approve
              </button>
              <button type="button" className="btn danger" onClick={() => decide(event._id, "rejected")}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      {!items.length && <p className="muted">No manual reviews in queue.</p>}

      <h2>Payments & escrow</h2>
      <p className="muted">Mark event complete, then release held payouts. Refund on fraud or cancel.</p>
      <div className="stack">
        {payments.map((p) => (
          <div key={p._id} className="card row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div className="stack" style={{ gap: "0.2rem" }}>
              <strong>{p.eventId?.title || "Event"}</strong>
              <span className="muted">
                {p.userId?.email} · ₹{p.amount} · <StatusPill status={p.status} />
              </span>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {p.escrowMeta?.note}
              </span>
            </div>
            <div className="row">
              <button type="button" className="btn secondary" onClick={() => complete(p.eventId?._id)}>
                Mark event complete
              </button>
              <button type="button" className="btn success" onClick={() => release(p._id)}>
                Release payout
              </button>
              <button type="button" className="btn danger" onClick={() => refund(p._id)}>
                Refund
              </button>
              <button type="button" className="btn secondary" onClick={() => cancel(p.eventId?._id)}>
                Cancel event
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
