import React, { useState } from "react";
import Tesseract from "tesseract.js";

const ReceiptScanner = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
  };

  const extractText = async () => {
    if (!image) return alert("Upload an image first");

    setLoading(true);

    try {
      const result = await Tesseract.recognize(
        image,
        "eng",
        {
          logger: (m) => console.log(m), // progress logs
        }
      );

      setText(result.data.text);
    } catch (error) {
      console.error(error);
      alert("Error extracting text");
    }

    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-3">Upload Receipt</h2>

      <input type="file" accept="image/*" onChange={handleImageUpload} />

      <button
        onClick={extractText}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Extract Details
      </button>

      {loading && <p className="mt-2">Processing...</p>}

      {text && (
        <div className="mt-4">
          <h3 className="font-bold">Extracted Text:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap">
            {text}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ReceiptScanner;