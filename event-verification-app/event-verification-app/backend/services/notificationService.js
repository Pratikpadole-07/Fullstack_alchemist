/** Stub: replace with SendGrid/SES + webhooks in production */

export async function notifyEmailStub({ to, subject, body }) {
  const payload = { to, subject, body, at: new Date().toISOString() };
  console.info("[email:stub]", JSON.stringify(payload));
  return { ok: true, channel: "stub" };
}

export async function notifyWebhookStub(event, payload) {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) {
    console.info("[webhook:stub]", event, payload);
    return { ok: true, channel: "stub" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload, at: new Date().toISOString() }),
    });
    return { ok: res.ok, channel: "webhook", status: res.status };
  } catch (e) {
    console.warn("[webhook:error]", e.message);
    return { ok: false, channel: "webhook" };
  }
}
