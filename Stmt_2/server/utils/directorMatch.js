import { compareTwoStrings } from "./stringSimilarity.js";

/**
 * Best fuzzy match score 0–100 between user name and director names.
 */
export function bestDirectorMatchScore(userName, directors = []) {
  const normalizedUser = normalizeName(userName);
  if (!normalizedUser || !directors.length) return 0;

  let best = 0;
  for (const d of directors) {
    const dn = normalizeName(d?.name);
    if (!dn) continue;
    if (normalizedUser === dn) return 100;
    const sim = compareTwoStrings(normalizedUser, dn);
    best = Math.max(best, sim);
  }
  return Math.round(best * 100);
}

function normalizeName(s) {
  if (!s || typeof s !== "string") return "";
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "");
}
