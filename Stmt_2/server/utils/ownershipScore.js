/**
 * ownershipScore =
 *   40% directorMatch +
 *   25% domainEmailVerified +
 *   20% GSTValid +
 *   15% companyActive
 *
 * Each input is 0–100 (boolean treated as 0 or 100).
 */
export function computeOwnershipScore({
  directorMatchScore,
  domainEmailVerified,
  gstValid,
  companyActive,
}) {
  const d = clamp01(directorMatchScore / 100);
  const dom = domainEmailVerified ? 1 : 0;
  const g = gstValid ? 1 : 0;
  const a = companyActive ? 1 : 0;
  const raw =
    0.4 * d * 100 +
    0.25 * dom * 100 +
    0.2 * g * 100 +
    0.15 * a * 100;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function scoreToVerificationStatus(score) {
  if (score > 75) return "owner_verified";
  if (score >= 40) return "partially_verified";
  return "rejected";
}

function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
