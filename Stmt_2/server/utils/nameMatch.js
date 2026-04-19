import { compareTwoStrings } from "./stringSimilarity.js";

export function namesLikelyMatch(a, b) {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return compareTwoStrings(x, y) >= 0.85;
}

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "");
}
