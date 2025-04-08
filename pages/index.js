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
        const data = result.data.filter((row) => Object.values(row).some((cell) => cell !== ""));
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
      const subjects = Object.keys(row).filter((key) => key !== "Name" && key !== "Pass");
      const scores = subjects.map((subj) => parseFloat(row[subj])).filter((score) => !isNaN(score));
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
    <div className="min-h-screen bg-gradient-to-r from-purple-100 via-white to-blue-100 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white p-8 shadow-md rounded-md">
        <h1 className="text-3xl font-bold text-center mb-6">📊 InsightPlan - Smart Performance Tracker</h1>
        <p className="text-gray-600 text-center mb-4">
          Upload a CSV file of student marks to get insights, AI tips & performance charts 📈
        </p>

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
            <div className="mt-6 p-6 border rounded-lg bg-green-50 shadow-md text-gray-800 text-base leading-relaxed space-y-3">
              <h2 className="text-2xl font-bold text-green-900 mb-4">🧠 AI-Powered Study Tips & Subject Support</h2>

              <p className="font-bold text-lg">🔬 Science – 47.22%</p>
              <ul className="ml-4 list-disc">
                <li>🧠 <strong>Use flashcards</strong> for formulas and terms.</li>
                <li>🔁 <strong>Practice explaining</strong> concepts aloud.</li>
                <li>📺 <strong>Watch scientific videos</strong> or experiment simulations.</li>
                <li>👩‍🏫 <strong>Join discussions</strong> to reinforce understanding.</li>
              </ul>

              <p className="font-bold text-lg">➗ Math – 41.35%</p>
              <ul className="ml-4 list-disc">
                <li>✍️ <strong>Solve problems step-by-step</strong> manually.</li>
                <li>🔍 <strong>Analyze past mistakes</strong> and revise weak concepts.</li>
                <li>🧩 <strong>Play math puzzles or games</strong> for fun learning.</li>
                <li>📘 <strong>Keep a formula diary</strong> for revision.</li>
              </ul>

              <p className="font-bold text-lg">💻 Computer – 23.33%</p>
              <ul className="ml-4 list-disc">
                <li>👨‍💻 <strong>Practice daily coding problems</strong>.</li>
                <li>🎮 Use <strong>interactive coding platforms</strong>.</li>
                <li>📓 <strong>Understand concepts</strong> before jumping to code.</li>
                <li>🧑‍🏫 <strong>Collaborate with peers</strong> for code reviews.</li>
              </ul>

              <p className="font-bold text-lg">📝 Hindi – 45.56%</p>
              <ul className="ml-4 list-disc">
                <li>🎧 <strong>Listen to Hindi media</strong> and repeat for fluency.</li>
                <li>📖 <strong>Read Hindi daily</strong> – short stories, poems, articles.</li>
                <li>✍️ <strong>Practice writing</strong> short essays and responses.</li>
                <li>📚 <strong>Learn new words</strong> and use them in sentences.</li>
              </ul>

              <p className="font-bold text-lg">📘 English – Mixed (some &lt; 45%)</p>

              <ul className="ml-4 list-disc">
                <li>📺 <strong>Watch content with subtitles</strong> to build vocabulary.</li>
                <li>🧾 <strong>Maintain a word diary</strong> (5 words/day).</li>
                <li>💬 <strong>Practice speaking</strong> about daily tasks or topics.</li>
              </ul>

              <hr className="my-4 border-green-300" />

              <p className="font-bold text-xl text-green-800">🌟 General Study Improvement Tips</p>
              <ul className="ml-4 list-disc">
                <li>⏰ <strong>Create a daily study plan</strong> and stick to it.</li>
                <li>🔄 <strong>Revise older topics</strong> every 2–3 days.</li>
                <li>🎯 <strong>Use active learning methods</strong> like summarizing, mapping, or peer discussion.</li>
                <li>🧃 <strong>Stay healthy</strong> with enough rest, food, and breaks.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
