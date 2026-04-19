import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client.js";

export default function NewEvent() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "",
    venue: "",
    date: "",
    price: "",
    description: "",
    posterUrl: "",
    organizerDisplayName: "",
    organizerContact: "",
    venueVerified: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [trust, setTrust] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await client.post("/events", {
        ...form,
        price: Number(form.price),
        venueVerified: Boolean(form.venueVerified),
      });
      setTrust(data.trust);
      nav(`/events/${data.event._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>New event</h1>
      <form className="card stack" onSubmit={submit}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Venue</label>
            <input className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Ticket price (INR)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Poster image URL</label>
            <input className="input" value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} />
          </div>
          <div>
            <label className="label">Organizer display name</label>
            <input
              className="input"
              value={form.organizerDisplayName}
              onChange={(e) => setForm({ ...form, organizerDisplayName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Organizer contact</label>
            <input
              className="input"
              value={form.organizerContact}
              onChange={(e) => setForm({ ...form, organizerContact: e.target.value })}
            />
          </div>
        </div>
        <label className="row" style={{ gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={form.venueVerified}
            onChange={(e) => setForm({ ...form, venueVerified: e.target.checked })}
          />
          <span>Venue pre-verified (demo toggle)</span>
        </label>
        <div>
          <label className="label">Description</label>
          <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {trust && (
          <p className="muted">
            Trust score {trust.score} · AI class: {trust.aiClass?.label} ({trust.aiClass?.source})
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Publishing…" : "Publish event"}
        </button>
      </form>
    </div>
  );
}
