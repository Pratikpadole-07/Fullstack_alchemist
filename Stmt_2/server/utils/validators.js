/** Indian CIN: 21 chars, L/U + 5 digits + 2 state + 4 year + 3 type + 6 reg */
const CIN_REGEX = /^[LUu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$/;

/** GSTIN: 15 chars */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidCIN(cin) {
  if (!cin || typeof cin !== "string") return false;
  return CIN_REGEX.test(cin.trim());
}

export function isValidGSTIN(gstin) {
  if (!gstin || typeof gstin !== "string") return false;
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

/**
 * Extract registrable domain from email (e.g. user@mail.abc.com -> mail.abc.com handling simplified).
 * For verification: compare email domain to company web domain derived from business email / user input.
 * We compare the part after @ to expectedDomain (normalized).
 */
export function emailDomain(email) {
  const at = email.lastIndexOf("@");
  if (at === -1) return "";
  return email.slice(at + 1).toLowerCase().trim();
}

export function normalizeCompanyDomain(input) {
  if (!input || typeof input !== "string") return "";
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.split("/")[0];
  if (s.startsWith("www.")) s = s.slice(4);
  return s;
}
