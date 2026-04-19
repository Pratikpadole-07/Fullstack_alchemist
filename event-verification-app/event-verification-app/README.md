# Event Trust & Verification (MERN)

Hackathon-ready demo for **event trust scoring**, **manual admin review**, **escrow-style ticket payments** (MongoDB state machine ready for Razorpay / RazorpayX Escrow), **fraud reports** with **OpenAI summaries** (optional), and **JWT auth**.

## Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI

## Quick start

### 1. MongoDB

Create a database (default name from sample env: `event_trust`).

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET; set ADMIN_EMAIL to the email you will use for the first admin account
npm install
npm run dev
```

API listens on `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend.

## Roles

- **Ticket buyer**: sign up as “Ticket buyer” (`role: user`). Browse events, book with escrow flow, report suspicious listings.
- **Organizer**: choose “Event organizer” at signup. Creates an `Organizer` profile automatically. Publish events; trust score + AI text check drive `approved` / `manual_review` / `rejected`.
- **Admin**: set `ADMIN_EMAIL` in backend `.env` to your email, then **sign up** with that exact email. You become `admin` and can open **Admin** and **Reports** in the nav.

## Trust score (server)

Rules (max 100): verified organizer +30; past successful events +20; low cancel rate +15; venue verified +15; no fraud reports +10; payment verified +10.

Decision: **≥80** `approved`, **50–79** `manual_review`, **&lt;50** `rejected`.

## Payments / escrow (demo + real keys)

1. `POST /api/payments/create-order` creates a Razorpay order when keys are set; otherwise a **demo order** id.
2. Frontend runs Checkout (or **demo pay** when no key).
3. `POST /api/payments/verify` verifies the Razorpay signature (skipped in demo mode), then saves `Payment.status = held` with `escrowMeta` notes for a future **RazorpayX Escrow** integration.
4. After the event is **completed**, `POST /api/payments/release` moves `held → released` (admin). On fraud/cancel, `POST /api/payments/refund`.

Replace the bodies of `services/razorpayService.js`, `escrowService.js`, and the payout/refund controller branches with RazorpayX Escrow / linked-account payout APIs when you wire production money movement.

## API (summary)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/signup` | Body: `name, email, password, role` (`user` or `organizer`) |
| POST | `/api/auth/login` | |
| GET/POST | `/api/events` | GET public; POST organizer/admin |
| GET/PATCH | `/api/events/:id` | PATCH owner or admin |
| POST | `/api/events/:id/verify` | Recompute trust |
| POST | `/api/events/:id/approve` | Admin |
| POST | `/api/events/:id/reject` | Admin |
| POST | `/api/payments/create-order` | Auth |
| POST | `/api/payments/verify` | Auth |
| POST | `/api/payments/hold` | Auth |
| POST | `/api/payments/release` | Admin |
| POST | `/api/payments/refund` | Admin |
| POST | `/api/reports` | Auth |
| GET | `/api/admin/reviews` | Admin |
| POST | `/api/admin/reviews/:id/decision` | Admin; `:id` = **event** id |
| GET | `/api/admin/reports` | Admin |
| GET | `/api/admin/payments` | Admin (extra helper for the panel) |

## AI & notifications

- With `OPENAI_API_KEY`, fraud summaries and admin risk blurbs use the Chat Completions API.
- Without it, **heuristic** summaries/classification are used so the UI still demos well.
- Email and webhooks are **stubs** (`notificationService.js`); logs to console unless `NOTIFY_WEBHOOK_URL` is set.

## Project layout

```
backend/   Express + Mongoose + JWT + Razorpay helper + trust/AI services
frontend/  React (Vite) + React Router + axios — entry `src/main.jsx`, app shell `src/App.jsx`
```

## License

MIT — hackathon / educational use.
