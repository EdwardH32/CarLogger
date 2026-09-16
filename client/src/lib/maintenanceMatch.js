function words(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Loosely match a part/service name against a logged maintenance entry's service name.
// A single shared word isn't enough — e.g. "Oil Filter Housing Gasket" sharing "oil" with a
// logged "Oil change" would be a false match even though they're unrelated repairs. Require
// the shorter name's words to mostly (or fully, if short) appear in the other name.
function isMatch(nameA, nameB) {
  const wordsA = words(nameA);
  const wordsB = words(nameB);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const setB = new Set(wordsB);
  const overlap = wordsA.filter((w) => setB.has(w)).length;
  const shorterLen = Math.min(wordsA.length, wordsB.length);
  const required = shorterLen >= 3 ? 2 : shorterLen;

  return overlap >= required;
}

// Find the logged maintenance entry that best matches a recommended part/service name, using
// the one with the highest logged mileage (most recent) as the "last serviced" reference point.
export function findLastService(entries, partName) {
  const matches = entries.filter((e) => isMatch(partName, e.service));
  if (matches.length === 0) return null;

  const withMileage = matches.filter((m) => m.mileage != null);
  if (withMileage.length > 0) {
    return withMileage.reduce((a, b) => (a.mileage > b.mileage ? a : b));
  }
  return matches[0];
}
