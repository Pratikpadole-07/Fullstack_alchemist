/**
 * OpenAI for fraud summaries / risk text. Falls back to heuristics when no API key.
 */

function heuristicRisk(event, reportsSample = []) {
  const flags = [];
  const text = `${event?.title || ""} ${event?.description || ""}`.toLowerCase();
  if (/free money|100% refund|wire transfer|bitcoin|crypto only|whatsapp only/i.test(text)) {
    flags.push("High-risk phrases in listing copy.");
  }
  if ((event?.price || 0) === 0 && text.length < 40) {
    flags.push("Very short description with zero price can indicate placeholder scams.");
  }
  if (reportsSample.length) {
    flags.push(`${reportsSample.length} open fraud report(s).`);
  }
  if (!flags.length) flags.push("No strong heuristic signals; still review context.");
  return flags.join(" ");
}

function heuristicClassify(text) {
  const t = (text || "").toLowerCase();
  if (/scam|fake|fraud|phish|stolen|illegal/i.test(t)) return "suspicious";
  if (/free money|bitcoin|wire only|whatsapp pay/i.test(t)) return "suspicious";
  return "normal";
}

export async function summarizeFraudReports(reports) {
  const blob = reports.map((r) => r.reportText).join("\n---\n");
  if (!process.env.OPENAI_API_KEY) {
    return `Mock summary (${reports.length} reports): common themes — ${blob.slice(0, 280)}${blob.length > 280 ? "…" : ""}`;
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Summarize fraud reports in 2-3 short bullet points for an admin dashboard.",
        },
        { role: "user", content: blob || "(no text)" },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function adminRiskExplanation(event, organizer) {
  if (!process.env.OPENAI_API_KEY) {
    return `Heuristic: ${heuristicRisk(event, [])} Organizer verified: ${Boolean(organizer?.isVerified)}.`;
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Give a 2-sentence risk explanation for admins about this event listing.",
        },
        {
          role: "user",
          content: JSON.stringify({
            title: event?.title,
            venue: event?.venue,
            description: event?.description,
            price: event?.price,
            trustScore: event?.trustScore,
            organizerVerified: organizer?.isVerified,
            cancelRate: organizer?.cancelRate,
          }),
        },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function classifyEventText(description) {
  if (!process.env.OPENAI_API_KEY) {
    return { label: heuristicClassify(description), source: "heuristic" };
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: 'Classify event description as exactly one word: "normal" or "suspicious".',
        },
        { role: "user", content: description || "" },
      ],
      temperature: 0,
    }),
  });
  if (!res.ok) {
    return { label: heuristicClassify(description), source: "heuristic_fallback" };
  }
  const data = await res.json();
  const raw = (data.choices?.[0]?.message?.content || "normal").toLowerCase();
  const label = raw.includes("suspicious") ? "suspicious" : "normal";
  return { label, source: "openai" };
}

export { heuristicRisk, heuristicClassify };
