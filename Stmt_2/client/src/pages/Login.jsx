import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import InputField from "../components/InputField.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md glass rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">Company ownership claim verification</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <InputField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <InputField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          No account?{" "}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
