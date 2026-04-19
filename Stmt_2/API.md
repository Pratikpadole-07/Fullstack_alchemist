# Company Ownership Claim Verification — API

Base URL: `http://localhost:5000/api` (or your deployed host).

All `/company/*` routes require header:

`Authorization: Bearer <JWT>`

---

## Health

### `GET /api/health`

Returns `{ ok: true, mock: boolean }`.

---

## Authentication

### `POST /api/auth/signup`

**Body (JSON)**

| Field | Type | Notes |
|-------|------|--------|
| name | string | Required |
| email | string | Valid email |
| password | string | Min 8 characters |

**Response:** `{ token, user: { id, name, email, role } }`

---

### `POST /api/auth/login`

**Body:** `{ email, password }`

**Response:** `{ token, user }` (same shape as signup).

---

### `GET /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `{ user: { id, name, email, role } }`

---

## Company verification

### `POST /api/company/verify-cin`

Runs MCA CIN check (placeholder service until real MCA API is integrated).

**Body**

| Field | Type | Notes |
|-------|------|--------|
| companyName | string | As per records |
| CIN | string | Valid Indian CIN format |
| GSTIN | string | Valid GSTIN format |
| companyDomain | string | e.g. `abc.com` — must match the host of `domainEmail` |
| domainEmail | string | e.g. `user@abc.com` |

**Validation:** CIN format; MCA response must indicate company exists and is `ACTIVE`.

**Response:** `company` snapshot (id, CIN, directors, etc.) and `mcaPreview` from the MCA layer.

---

### `POST /api/company/verify-gst`

**Body:** `{ companyId }` (Mongo ObjectId string)

Uses stored `GSTIN` and `companyName`. Calls GST service (placeholder).

**Validation:** GST status active; business name fuzzy-matches company name.

---

### `POST /api/company/match-owner`

**Body:** `{ companyId }`

Compares logged-in user’s **name** (from profile) to MCA `directors` using fuzzy matching. Updates `directorMatchScore` (0–100).

---

### `POST /api/company/send-otp`

**Body:** `{ companyId }`

Sends OTP to `domainEmail` if SMTP is configured. If `MOCK=true` or `SKIP_EMAIL=true`, email is skipped and `devOtp` is returned for testing.

---

### `POST /api/company/verify-otp`

**Body:** `{ companyId, otp }`

Marks `domainEmailVerified` when OTP matches and is not expired.

---

### `POST /api/company/finalize`

**Body:** `{ companyId }`

Computes:

`ownershipScore = 40% directorMatch + 25% domainVerified + 20% GSTValid + 15% companyActive`

(component inputs are 0–100 or boolean scaled to 0/100)

**Status:**

| Score | `verificationStatus` |
|-------|----------------------|
| > 75 | `owner_verified` |
| 40–75 | `partially_verified` |
| < 40 | `rejected` |

---

### `GET /api/company/mine`

Lists recent companies for the current user (summary).

---

### `GET /api/company/:id`

Full company document for the owner.

---

## Integration placeholders

- `server/services/mcaService.js` — `// TODO: ADD MCA API HERE`
- `server/services/gstService.js` — `// TODO: ADD GST API HERE`

When `MOCK=true`, stub data is used for predictable local testing.
