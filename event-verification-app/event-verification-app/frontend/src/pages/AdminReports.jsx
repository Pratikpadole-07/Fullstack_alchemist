import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import Loader from "../components/Loader.jsx";

export default function AdminReports() {
  const [data, setData] = useState({ reports: [], batchSummary: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await client.get("/admin/reports");
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.message || "Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="container stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Fraud reports</h1>
        <Link to="/admin/review">← Admin home</Link>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h3>AI batch summary</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{data.batchSummary}</p>
      </div>
      <div className="stack">
        {data.reports.map((r) => (
          <div key={r._id} className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{r.eventId?.title || "Event"}</strong>
              <span className="muted">{new Date(r.createdAt).toLocaleString()}</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              By {r.userId?.name} ({r.userId?.email})
            </p>
            <p style={{ margin: 0 }}>{r.reportText}</p>
            <p className="muted" style={{ margin: 0 }}>
              AI: {r.aiSummary}
            </p>
            <Link to={`/events/${r.eventId?._id}`}>Open event</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
