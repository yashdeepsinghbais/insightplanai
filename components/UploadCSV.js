// components/UploadCSV.js
import React, { useRef } from "react";
import { FaPlus } from "react-icons/fa";

// Function to escape problematic characters (quotes)
const escapeString = (str) => {
  return str.replace(/["']/g, '\\$&'); // Escapes double and single quotes
};

const UploadCSV = ({ onDataParsed }) => {
  const fileInputRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");

    const data = lines.slice(1).map((line) => {
      const values = line.split(",");
      return headers.reduce((obj, header, i) => {
        obj[escapeString(header)] = escapeString(values[i]); // Escape headers and values
        return obj;
      }, {});
    });

    onDataParsed(data);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-lg space-y-4">
      <h1 className="text-2xl font-bold text-center">
        📊 Upload Student Performance CSV
      </h1>
      <p className="text-gray-600 text-center">
        Upload your CSV file containing student performance data. This helps us
        analyze and give improvement suggestions.
      </p>

      <div className="flex justify-center items-center gap-3">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
        <button
          onClick={triggerFileInput}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Choose File
          <FaPlus className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default UploadCSV;
