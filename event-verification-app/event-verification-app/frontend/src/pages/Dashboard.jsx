import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/Loader.jsx";
import TrustBadge from "../components/TrustBadge.jsx";
import StatusPill from "../components/StatusPill.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await client.get("/events");
        if (alive) setEvents(data.events || []);
      } catch (e) {
        if (alive) setError(e.response?.data?.message || "Failed to load events");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", margin: "1rem 0" }}>
        <div>
          <h1 style={{ margin: 0 }}>Events</h1>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            Verified listings, escrow-protected tickets.
          </p>
        </div>
        {(user?.role === "organizer" || user?.role === "admin") && (
          <Link to="/events/new" className="btn">
            New event
          </Link>
        )}
      </div>

      {loading && <Loader />}
      {error && <p className="error">{error}</p>}

      <div className="grid cards">
        {events.map((ev) => (
          <Link key={ev._id} to={`/events/${ev._id}`} style={{ color: "inherit" }}>
            <div className="card stack" style={{ height: "100%" }}>
              {ev.posterUrl ? (
                <img className="poster" src={ev.posterUrl} alt="" />
              ) : (
                <div className="poster muted" style={{ display: "grid", placeItems: "center" }}>
                  No poster
                </div>
              )}
              <div className="row" style={{ justifyContent: "space-between" }}>
                <TrustBadge score={ev.trustScore} />
                <StatusPill status={ev.status} />
              </div>
              <h3 style={{ margin: 0 }}>{ev.title}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {ev.venue} · {new Date(ev.date).toLocaleString()}
              </p>
              <p style={{ margin: 0, fontWeight: 700 }}>₹{ev.price}</p>
            </div>
          </Link>
        ))}
      </div>

      {!loading && !events.length && <p className="muted">No events yet. Organizers can publish the first one.</p>}
    </div>
  );
}
