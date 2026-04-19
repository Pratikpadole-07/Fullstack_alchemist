import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/Loader.jsx";
import TrustBadge from "../components/TrustBadge.jsx";
import StatusPill from "../components/StatusPill.jsx";

export default function EventDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportText, setReportText] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/events/${id}`);
      setEvent(data.event);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const report = async () => {
    setMsg("");
    try {
      await client.post("/reports", { eventId: id, reportText });
      setReportText("");
      setMsg("Report submitted. Admins will review.");
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || "Report failed");
    }
  };

  if (loading) return <Loader />;
  if (error || !event) return <p className="error container">{error || "Not found"}</p>;

  const orgUser = event.organizerId?.userId;
  const canBook = isAuthenticated && event.status === "approved";

  return (
    <div className="container stack" style={{ maxWidth: 900 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link to="/dashboard" className="muted">
          ← Back
        </Link>
        <div className="row">
          <TrustBadge score={event.trustScore} />
          <StatusPill status={event.status} />
        </div>
      </div>

      <div className="card stack">
        <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "1rem" }}>
          <div className="stack">
            <h1 style={{ margin: 0 }}>{event.title}</h1>
            <p className="muted" style={{ margin: 0 }}>
              {event.venue}
            </p>
            <p style={{ margin: 0 }}>{new Date(event.date).toLocaleString()}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>₹{event.price}</p>
            <p style={{ lineHeight: 1.5 }}>{event.description}</p>
          </div>
          <div className="stack">
            {event.posterUrl ? <img className="poster" src={event.posterUrl} alt="" style={{ maxHeight: 260 }} /> : null}
            <div className="card" style={{ background: "#0f172a" }}>
              <h4 style={{ marginTop: 0 }}>Organizer</h4>
              <p style={{ margin: 0 }}>{event.organizerDisplayName || orgUser?.name || "Organizer"}</p>
              <p className="muted" style={{ margin: 0 }}>
                {event.organizerContact || orgUser?.email}
              </p>
              <p className="muted" style={{ margin: "0.5rem 0 0" }}>
                Fraud reports flagged: {event.hasFraudReports ? "yes" : "no"}
              </p>
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: "0.75rem" }}>
          {event.status === "approved" && (
            <button type="button" className="btn success" disabled={!canBook} onClick={() => nav(`/payment/${event._id}`)}>
              Book with escrow
            </button>
          )}
          {!isAuthenticated && <span className="muted">Login as a ticket buyer to book.</span>}
        </div>
      </div>

      <div className="card stack">
        <h3>Report a suspicious event</h3>
        <textarea className="textarea" value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="What looks wrong?" />
        <button type="button" className="btn danger" disabled={!isAuthenticated || !reportText} onClick={report}>
          Report fake event
        </button>
        {!isAuthenticated && <p className="muted">Login to submit a report.</p>}
        {msg && <p className="muted">{msg}</p>}
      </div>
    </div>
  );
}
