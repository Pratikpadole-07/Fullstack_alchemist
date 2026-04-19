# Company Ownership Claim Verification (MERN)

Production-oriented starter app: JWT auth, MongoDB models, MCA/GST **placeholder** services with `MOCK=true`, nodemailer OTP for domain email, and a React + Tailwind UI.

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Quick start

### 1. MongoDB

Start MongoDB locally or create an Atlas cluster and copy the connection string.

### 2. Backend

```bash
cd server
copy ..\.env.example .env
```

Edit `server/.env`: set `MONGODB_URI`, `JWT_SECRET`, and optionally `MOCK`, `SKIP_EMAIL`, SMTP settings.

```bash
npm install
npm run dev
```

API: `http://localhost:5000` — health check: `GET /api/health`

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App: `http://localhost:5173` (Vite proxies `/api` to port 5000).

### 4. Try the flow

1. Sign up with a **full name** that is close to a director name in the mock MCA list (`John Doe`, `Jane Smith`) for a high director score, or use a different name to see partial/rejected scores.
2. Open **Company verification** and fill:
   - **CIN** — valid 21-character format (e.g. `U12345MH2020PTC123456`).
   - **GSTIN** — valid 15-character format (e.g. `27ABCDE1234F1Z5`).
   - **Company domain** — e.g. `abc.com`.
   - **Domain email** — e.g. `you@abc.com` (must match the domain).
3. **Verify company (CIN)** → **Verify GST** → **Match owner** → **Send domain OTP** → enter OTP (with `MOCK=true` or `SKIP_EMAIL=true`, the API returns `devOtp`) → **Calculate final score**.

## Project layout

- `server/` — Express, MVC folders (`models`, `controllers`, `routes`, `middleware`, `services`, `utils`)
- `client/` — React (Vite), Tailwind, protected routes, verification UI

## API documentation

See [API.md](./API.md).

## Security notes

- Passwords hashed with bcrypt.
- JWT on protected routes; `helmet`, CORS, `express-mongo-sanitize`, input validation.
- Replace placeholder MCA/GST integrations before production; restrict CORS and secrets in deployment.

## License

MIT (sample project).
