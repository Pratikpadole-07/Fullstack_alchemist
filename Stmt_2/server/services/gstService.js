import axios from "axios";

// 🔹 GSTIN Format Validator
function isValidGSTIN(gstin) {
  const regex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
  return regex.test(gstin);
}

// 🔹 Fallback Mock
const MOCK_GST_RESPONSE = {
  gstin: "27ABCDE1234F1Z5",
  businessName: "Mock Company Pvt Ltd",
  status: "Active",
};

export async function verifyGST(gstin) {
  const normalized = (gstin || "").trim().toUpperCase();

  try {
    // ❌ Invalid GSTIN format
    if (!isValidGSTIN(normalized)) {
      throw new Error("Invalid GSTIN format");
    }

    // 🔹 No API key → use mock
    if (!process.env.GST_API_KEY) {
      console.log("Using MOCK GST Data");

      return {
        ...MOCK_GST_RESPONSE,
        gstin: normalized,
      };
    }

    // 🔥 REAL API CALL
    const response = await axios.get(
      "https://appyflow.in/api/verifyGST",
      {
        params: {
          gstNo: normalized,
          key_secret: process.env.GST_API_KEY,
        },
      }
    );

    const data = response.data;

    console.log("GST API RAW RESPONSE:", data); // 🔥 Debug log

    // ❌ Handle API-level errors
    if (!data || data.error) {
      throw new Error(data?.message || "Invalid GST API response");
    }

    const taxpayer = data.taxpayerInfo;

    if (!taxpayer) {
      throw new Error("GSTIN not found");
    }

    // 🔄 Normalize status
    let status = taxpayer.sts || "Unknown";
    if (status === "ACT") status = "Active";
    if (status === "INA") status = "Inactive";

    return {
      gstin: normalized,
      businessName:
        taxpayer.tradeNam || taxpayer.lgnm || "N/A",
      status,
    };

  } catch (error) {
    console.error("GST API Error:", error.message);

    // 🔹 Safe fallback (never break app)
    return {
      ...MOCK_GST_RESPONSE,
      gstin: normalized,
      status: "Unknown",
    };
  }
}



// /**
//  * GST verification (placeholder).
//  */

// const MOCK_GST_RESPONSE = {
//   gstin: "27ABCDE1234F1Z5",
//   businessName: "ABC Pvt Ltd",
//   status: "Active",
// };

// export async function verifyGST(gstin) {
//   const normalized = (gstin || "").trim().toUpperCase();

//   if (process.env.MOCK === "true") {
//     return {
//       ...MOCK_GST_RESPONSE,
//       gstin: normalized || MOCK_GST_RESPONSE.gstin,
//     };
//   }

//   // TODO: ADD GST API HERE
//   // return { gstin, businessName, status }

//   return {
//     gstin: normalized,
//     businessName: MOCK_GST_RESPONSE.businessName,
//     status: "Active",
//   };
// }
