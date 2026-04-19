# Identity Verification & Trust Platform (MERN)

Premium SaaS-style identity verification + trust scoring platform with admin review.

## Tech

- **Frontend**: React (JSX), React Router, Axios, Tailwind CSS, Framer Motion, Lucide, react-hot-toast
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Multer uploads, bcryptjs

## Quickstart (local)

### 1) Backend

Create `backend/.env` from `backend/.env.example`.

Run:

```bash
npm --prefix backend install
npm --prefix backend run seed
npm --prefix backend run dev
```

Backend runs on `http://localhost:5000` and serves uploads from `http://localhost:5000/uploads/*`.

### 2) Frontend

Create `frontend/.env` from `frontend/.env.example` (optional).

Run:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Frontend runs on `http://localhost:5173`.

## Demo accounts

- **Admin**: `admin@identitytrust.io` / `Admin123!`
- **User**: `mateo@demo.com` / `Password123!`

## Notes

- OTP verification is demo-mode: the code is **123456**.
- ID/selfie uploads are stored on disk in `backend/uploads/`.

