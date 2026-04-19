/** Common consumer domains — flagged as higher risk for institutional deal-making. */
const GENERIC_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'protonmail.com',
  'proton.me',
  'aol.com',
  'live.com',
  'msn.com',
]);

export function extractDomain(email) {
  const at = email.indexOf('@');
  if (at === -1) return '';
  return email.slice(at + 1).toLowerCase().trim();
}

export function isGenericEmailDomain(email) {
  return GENERIC_DOMAINS.has(extractDomain(email));
}
