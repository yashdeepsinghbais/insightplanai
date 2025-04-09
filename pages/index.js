import { useState } from "react";
import Papa from "papaparse";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Home() {
  const [csvData, setCsvData] = useState([]);
  const [averages, setAverages] = useState({});
  const [performanceGroups, setPerformanceGroups] = useState({
    Poor: [],
    Mid: [],
    Excellent: [],
  });
  const [aiTips, setAiTips] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        const data = result.data.filter((row) =>
          Object.values(row).some((cell) => cell !== "")
        );
        setCsvData(data);
        calculateAverages(data);
        calculatePerformanceGroups(data);
        generateAiSuggestions(data);
      },
    });
  };

  const calculateAverages = (data) => {
    const subjectSums = {};
    const subjectCounts = {};

    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "Name" && key !== "Pass" && !isNaN(parseFloat(row[key]))) {
          const val = parseFloat(row[key]);
          subjectSums[key] = (subjectSums[key] || 0) + val;
          subjectCounts[key] = (subjectCounts[key] || 0) + 1;
        }
      });
    });

    const avg = {};
    Object.keys(subjectSums).forEach((subject) => {
      avg[subject] = (subjectSums[subject] / subjectCounts[subject]).toFixed(2);
    });

    setAverages(avg);
  };

  const calculatePerformanceGroups = (data) => {
    const groups = { Poor: [], Mid: [], Excellent: [] };

    data.forEach((row) => {
      const subjects = Object.keys(row).filter(
        (key) => key !== "Name" && key !== "Pass"
      );
      const scores = subjects
        .map((subj) => parseFloat(row[subj]))
        .filter((score) => !isNaN(score));
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

      if (avg < 35) groups.Poor.push(row.Name);
      else if (avg < 75) groups.Mid.push(row.Name);
      else groups.Excellent.push(row.Name);
    });

    setPerformanceGroups(groups);
  };

  const generateAiSuggestions = async (data) => {
    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvData: data }),
      });

      const result = await response.json();
      setAiTips(result.suggestion);
    } catch (error) {
      console.error("Error fetching AI suggestion:", error);
      setAiTips("⚠️ Could not fetch suggestions from AI.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-100 via-white to-sky-100 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white p-8 shadow-md rounded-md">
        <h1 className="text-3xl font-bold text-center mb-6">
          📊 InsightPlan - Smart Performance Tracker
        </h1>
        <p className="text-gray-600 text-center mb-4">
          Upload a CSV file of student marks to get insights, AI tips & performance charts 📈
        </p>

        {/* CSV Format Instructions */}
        <div className="mb-6 p-4 border-l-4 border-blue-500 bg-blue-50 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-blue-800">📄 CSV Format Instructions</h2>
          <p className="text-gray-700 mb-2">
            Please ensure your CSV file includes the following columns for accurate analysis:
          </p>
          <ul className="list-disc ml-6 text-sm text-gray-800 space-y-1">
            <li><strong>Name</strong> – Student&apos;s full name</li>
            <li><strong>Math</strong> – Marks in Mathematics</li>
            <li><strong>Science</strong> – Marks in Science</li>
            <li><strong>Computer</strong> – Marks in Computer Science</li>
            <li><strong>English</strong> – Marks in English</li>
            <li><strong>Hindi</strong> – Marks in Hindi</li>
          </ul>
          <p className="mt-2 text-gray-600 text-sm">
            🔄 <strong>You can also add extra columns</strong> like <em>Attendance, Participation, Discipline</em>, etc.
            These won&apos;t affect performance analysis unless they are numeric and treated like marks.
          </p>
          <p className="mt-1 text-gray-600 text-sm">
            ✅ The app will auto-detect numeric fields (excluding "Name" and "Pass") and calculate performance based on them.
          </p>
        </div>

        {/* File Upload */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            />
          </label>
          <span className="text-2xl">➕</span>
        </div>

        {Object.keys(averages).length > 0 && (
          <>
            {/* Average Marks */}
            <div className="mt-6 p-4 border rounded-lg bg-yellow-50">
              <h2 className="text-xl font-semibold mb-2">📉 Average Marks per Subject</h2>
              <ul className="list-disc list-inside text-gray-700">
                {Object.entries(averages).map(([subject, avg], index) => (
                  <li key={index}>
                    <strong>{subject}:</strong> {avg}
                  </li>
                ))}
              </ul>
            </div>

            {/* Performance Category Chart */}
            <div className="mt-6 p-4 border rounded-lg bg-blue-50">
              <h2 className="text-xl font-semibold mb-2">🎯 Performance Categories (Based on Avg Marks)</h2>
              <Bar
                data={{
                  labels: ["Poor", "Mid", "Excellent"],
                  datasets: [
                    {
                      label: "Number of Students",
                      data: [
                        performanceGroups.Poor.length,
                        performanceGroups.Mid.length,
                        performanceGroups.Excellent.length,
                      ],
                      backgroundColor: ["#f87171", "#facc15", "#4ade80"],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const category = context.label;
                          const names = performanceGroups[category].join(", ");
                          return `${context.dataset.label}: ${context.raw}\n${names}`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>

            {/* AI Suggestions */}
            <div className="mt-6 p-6 border rounded-lg bg-green-50 shadow-md">
              <h2 className="text-2xl font-bold text-green-900 mb-4">🧠 AI-Powered Learning Dashboard</h2>
              <div className="space-y-4 text-gray-800 text-base leading-relaxed">
                {aiTips.split("\n").map((line, index) => {
                  if (
                    line.match(/^(\d+\.\s|[-•])?\s?(Subject|General|Tip|Tips|Math|Science|English|Hindi|Computer)/i)
                  ) {
                    return (
                      <p key={index} className="font-semibold text-green-900">
                        {line}
                      </p>
                    );
                  }
                  if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
                    return (
                      <p key={index} className="ml-4 before:content-['🔹'] before:mr-2">
                        {line.replace(/^[-•]\s*/, "")}
                      </p>
                    );
                  }
                  if (line.trim().match(/^\d+\./)) {
                    return (
                      <p key={index} className="ml-2">
                        <span className="font-medium text-green-800">{line}</span>
                      </p>
                    );
                  }
                  return <p key={index}>{line}</p>;
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
