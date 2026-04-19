import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import InputField from "../components/InputField.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", { name, email, password });
      login(data.token, data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      const errs = err.response?.data?.errors;
      setError(msg || (errs && errs[0]?.msg) || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md glass rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">Use your legal name — it is matched against MCA directors.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <InputField
            id="name"
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
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
            label="Password (min 8 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
