/**
 * MCA (Ministry of Corporate Affairs) — CIN lookup (placeholder).
 */

const MOCK_CIN_RESPONSE = {
  companyName: "ABC Pvt Ltd",
  CIN: "U12345MH2020PTC123456",
  status: "ACTIVE",
  directors: [{ name: "John Doe" }, { name: "Jane Smith" }],
};

export async function verifyCIN(cin) {
  const normalized = (cin || "").trim().toUpperCase();

  if (process.env.MOCK === "true") {
    return {
      ...MOCK_CIN_RESPONSE,
      CIN: normalized || MOCK_CIN_RESPONSE.CIN,
    };
  }

  // TODO: ADD MCA API HERE
  // Example: const res = await fetch(MCA_URL, { ... });
  // return parsed body matching:
  // { companyName, CIN, status, directors: [{ name }] }

  return {
    companyName: MOCK_CIN_RESPONSE.companyName,
    CIN: normalized,
    status: "ACTIVE",
    directors: MOCK_CIN_RESPONSE.directors,
  };
}
