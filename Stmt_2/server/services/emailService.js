import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT) {
    throw new Error("SMTP_HOST and SMTP_PORT must be set for email");
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendDomainOtpEmail(to, otp) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@localhost";
  const info = await getTransporter().sendMail({
    from,
    to,
    subject: "Your company domain verification code",
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
  return info;
}
