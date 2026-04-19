import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import InputField from "../components/InputField.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ScoreCard from "../components/ScoreCard.jsx";
import OTPVerification from "../components/OTPVerification.jsx";
import Tesseract from "tesseract.js";

export default function CompanyVerification() {
  const [companyName, setCompanyName] = useState("");
  const [CIN, setCIN] = useState("");
  const [GSTIN, setGSTIN] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [domainEmail, setDomainEmail] = useState("");

  const [companyId, setCompanyId] = useState(null);
  const [cinResult, setCinResult] = useState(null);
  const [gstResult, setGstResult] = useState(null);
  const [ownerResult, setOwnerResult] = useState(null);
  const [devOtp, setDevOtp] = useState(null);
  const [finalizeResult, setFinalizeResult] = useState(null);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptText, setReceiptText] = useState("");
  const [parsedReceipt, setParsedReceipt] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  async function verifyCompany() {
    setError("");
    setBusy(true);
    setCinResult(null);
    setGstResult(null);
    setOwnerResult(null);
    setFinalizeResult(null);
    setDevOtp(null);
    try {
      const { data } = await api.post("/company/verify-cin", {
        companyName,
        CIN,
        GSTIN,
        companyDomain,
        domainEmail,
      });
      setCompanyId(data.company.id);
      setCinResult(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "CIN verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function verifyGst() {
    if (!companyId) return;
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/company/verify-gst", { companyId });
      setGstResult(data);
    } catch (e) {
      setError(e.response?.data?.message || "GST verification failed");
    } finally {
      setBusy(false);
    }
  }


  async function matchOwner() {
    if (!companyId) return;
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/company/match-owner", { companyId });
      setOwnerResult(data);
    } catch (e) {
      setError(e.response?.data?.message || "Director match failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    if (!companyId) return;
    setError("");
    setBusy(true);
    setDevOtp(null);
    try {
      const { data } = await api.post("/company/send-otp", { companyId });
      if (data.devOtp) setDevOtp(data.devOtp);
    } catch (e) {
      setError(e.response?.data?.message || "Could not send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(otp) {
    if (!companyId) return;
    setError("");
    setBusy(true);
    try {
      await api.post("/company/verify-otp", { companyId, otp });
      setDevOtp(null);
    } catch (e) {
      setError(e.response?.data?.message || "OTP invalid");
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (!companyId) return;
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/company/finalize", { companyId });
      setFinalizeResult(data);
    } catch (e) {
      setError(e.response?.data?.message || "Finalize failed");
    } finally {
      setBusy(false);
    }
  }
  function parseReceipt(text) {
  const amountMatch = text.match(/(\d+\.\d{2})/);
  const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
  const gstMatch = text.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]/);

  return {
    amount: amountMatch ? amountMatch[0] : "Not found",
    date: dateMatch ? dateMatch[0] : "Not found",
    gstin: gstMatch ? gstMatch[0] : "Not found",
  };
}

async function extractReceiptData() {
  if (!receiptImage) return alert("Upload receipt first");

  setOcrLoading(true);

  try {
    const result = await Tesseract.recognize(receiptImage, "eng", {
      logger: (m) => console.log(m),
    });

    const text = result.data.text;
    setReceiptText(text);

    const parsed = parseReceipt(text);
    setParsedReceipt(parsed);

    // 🔥 AUTO-FILL GSTIN (very powerful feature)
    if (parsed.gstin !== "Not found") {
      setGSTIN(parsed.gstin);
    }

  } catch (err) {
    console.error(err);
    setError("OCR failed");
  }

  setOcrLoading(false);
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-16">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
            ← Dashboard
          </Link>
          <span className="text-sm font-medium text-slate-400">Company verification</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        <section className="glass rounded-2xl p-6 space-y-4">
          <h1 className="text-xl font-bold text-white">Company details</h1>
          <p className="text-sm text-slate-400">
            Enter MCA and GST identifiers plus a company-domain email. Declare the email domain you control (e.g.{" "}
            <code className="text-slate-300">abc.com</code>) — it must match the part after{" "}
            <code className="text-slate-300">@</code> in the domain email.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField id="cn" label="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <InputField id="cin" label="CIN" value={CIN} onChange={(e) => setCIN(e.target.value.toUpperCase())} />
            <InputField id="gst" label="GSTIN" value={GSTIN} onChange={(e) => setGSTIN(e.target.value.toUpperCase())} />
            <InputField
              id="cdom"
              label="Company domain"
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value.toLowerCase())}
              hint="e.g. abc.com (no https://)"
            />
            <div className="sm:col-span-2">
              <InputField
                id="demail"
                label="Domain email"
                type="email"
                value={domainEmail}
                onChange={(e) => setDomainEmail(e.target.value.toLowerCase())}
                hint="Must be @your-company-domain"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="button"
            onClick={verifyCompany}
            disabled={busy}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {busy ? "Working…" : "Verify company (CIN)"}
          </button>
        </section>

        {cinResult && (
          <section className="glass rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white">MCA — CIN</h2>
            <p className="text-sm text-slate-400">
              Status:{" "}
              <span className="text-slate-200">{cinResult.company?.mcaStatus}</span> · Active:{" "}
              <span className={cinResult.company?.companyActive ? "text-emerald-400" : "text-red-400"}>
                {cinResult.company?.companyActive ? "Yes" : "No"}
              </span>
            </p>
            <div>
              <p className="text-xs uppercase text-slate-500">Directors</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-300">
                {(cinResult.company?.directors || []).map((d, i) => (
                  <li key={i}>{d.name}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={verifyGst}
                disabled={busy}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                Verify GST
              </button>
              <button
                type="button"
                onClick={matchOwner}
                disabled={busy}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                Match owner (directors)
              </button>
            </div>
          </section>
        )}

        {gstResult && (
          <section className="glass rounded-2xl p-6 space-y-2">
            <h2 className="text-lg font-semibold text-white">GST</h2>
            <p className="text-sm text-slate-400">
              Business: <span className="text-slate-200">{gstResult.gst?.businessName}</span>
            </p>
            <p className="text-sm text-slate-400">
              GST valid & name match:{" "}
              <span className={gstResult.gst?.gstValid ? "text-emerald-400" : "text-amber-400"}>
                {gstResult.gst?.gstValid ? "Yes" : "No"}
              </span>
            </p>
          </section>
        )}

        {ownerResult && (
          <section className="glass rounded-2xl p-6 space-y-2">
            <h2 className="text-lg font-semibold text-white">Director match</h2>
            <p className="text-sm text-slate-400">
              Your name: <span className="text-slate-200">{ownerResult.userName}</span>
            </p>
            <p className="text-sm text-slate-400">
              Match score: <span className="text-slate-200">{ownerResult.directorMatchScore}</span> / 100
            </p>
          </section>
        )}
        <section className="glass rounded-2xl p-6 space-y-4">
  <h2 className="text-lg font-semibold text-white">Upload Receipt (OCR)</h2>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => setReceiptImage(e.target.files[0])}
    className="text-sm text-slate-300"
  />

  <button
    onClick={extractReceiptData}
    disabled={ocrLoading}
    className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-500"
  >
    {ocrLoading ? "Processing..." : "Extract Receipt Data"}
  </button>

  {parsedReceipt && (
    <div className="text-sm text-slate-300 space-y-1">
      <p>Amount: {parsedReceipt.amount}</p>
      <p>Date: {parsedReceipt.date}</p>
      <p>GSTIN: {parsedReceipt.gstin}</p>
    </div>
  )}

  {receiptText && (
    <details className="text-xs text-slate-500">
      <summary>View Raw OCR Text</summary>
      <pre className="whitespace-pre-wrap">{receiptText}</pre>
    </details>
  )}
</section>
        {companyId && (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sendOtp}
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Send domain OTP
              </button>
              <button
                type="button"
                onClick={finalize}
                disabled={busy}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                Calculate final score
              </button>
            </div>
            <OTPVerification onSubmit={verifyOtp} loading={busy} devOtpHint={devOtp} />
          </section>
        )}

        {finalizeResult && (
          <section className="space-y-4">
            <ScoreCard score={finalizeResult.ownershipScore} />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Verification:</span>
              <StatusBadge status={finalizeResult.verificationStatus} />
            </div>
            <p className="text-xs text-slate-500">
              Rules: score &gt; 75 owner verified · 40–75 partial · &lt; 40 rejected.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
