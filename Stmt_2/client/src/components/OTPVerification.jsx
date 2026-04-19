import { useState } from "react";
import InputField from "./InputField.jsx";

export default function OTPVerification({ onSubmit, loading, devOtpHint }) {
  const [otp, setOtp] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(otp.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 p-5">
      <div>
        <h3 className="text-sm font-semibold text-white">Domain email OTP</h3>
        <p className="mt-1 text-xs text-slate-500">
          Enter the code sent to your company domain inbox. The email domain must match your declared company domain.
        </p>
      </div>
      {devOtpHint && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200 border border-amber-500/30">
          Dev / mock: use OTP <strong>{devOtpHint}</strong>
        </p>
      )}
      <InputField
        id="otp"
        label="One-time code"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
        placeholder="6-digit code"
        autoComplete="one-time-code"
      />
      <button
        type="submit"
        disabled={loading || otp.length < 4}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? "Verifying…" : "Verify OTP"}
      </button>
    </form>
  );
}
