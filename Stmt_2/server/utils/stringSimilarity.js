/**
 * Sørensen–Dice coefficient on character bigrams (same family as string-similarity compareTwoStrings).
 */
export function compareTwoStrings(first, second) {
  const a = first.replace(/\s+/g, " ").trim();
  const b = second.replace(/\s+/g, " ").trim();
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
  }
  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const c = bigrams.get(bg) || 0;
    if (c > 0) {
      bigrams.set(bg, c - 1);
      intersection++;
    }
  }
  return (2 * intersection) / (a.length + b.length - 2);
}
