export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Only POST allowed" });
    }
  
    const { csvData } = req.body;
  
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ message: "Invalid CSV data" });
    }
  
    const subjects = Object.keys(csvData[0]).filter(
      (key) => key !== "Name" && key !== "Pass"
    );
  
    const subjectStats = {};
  
    for (const subject of subjects) {
      let total = 0;
      let count = 0;
      let ratingCount = { Good: 0, Average: 0, Bad: 0 };
  
      for (const row of csvData) {
        const val = row[subject];
        if (!val) continue;
  
        const numeric = parseFloat(val);
        if (!isNaN(numeric)) {
          total += numeric;
          count += 1;
        } else {
          const rating = val.trim().toLowerCase();
          if (rating === "good") ratingCount.Good++;
          else if (rating === "average") ratingCount.Average++;
          else if (rating === "bad") ratingCount.Bad++;
        }
      }
  
      if (count > 0 || ratingCount.Good || ratingCount.Average || ratingCount.Bad) {
        subjectStats[subject] = count
          ? { type: "numeric", avg: (total / count).toFixed(2) }
          : { type: "rating", ...ratingCount };
      }
    }
  
    const formattedStats = Object.entries(subjectStats)
      .map(([subject, data]) => {
        if (data.type === "numeric") {
          return `${subject}: ${data.avg}%`;
        } else {
          return `${subject}: Good - ${data.Good}, Average - ${data.Average}, Bad - ${data.Bad}`;
        }
      })
      .join("\n");
  
    const systemPrompt = `You are an AI educational assistant. Based on the subject performance provided, generate AI-powered study tips.
  
  Use this exact format:
  - Each subject title must be **bold with emoji and performance** (e.g., **Math 🤔**: 61.65%)
  - Add 3-4 bullet points starting with '-' (not '*')  
  - Add a **Pro Tip:** for each subject with some unique learning advice  
  - Use emojis for fun and engagement  
  - Add a line break between each bullet point  
  - After each subject, include a horizontal line (---) for visual separation  
  - End with a **General Improvement Tips 💪** section (4-5 tips with the same structure)  
  - Format using markdown style  
  - ⚠️ If a subject has no valid data or no tips to suggest, skip it entirely (no heading, no line)  
  - Do not include empty or placeholder subjects`;
  
    const userPrompt = `Here is the subject performance summary:\n\n${formattedStats}\n\nNow generate the AI-powered study tips.`;
  
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  
    const data = await response.json();
  
    if (!data.choices || !data.choices.length) {
      return res.status(500).json({ suggestion: "⚠️ AI could not generate suggestions." });
    }
  
    return res.status(200).json({ suggestion: data.choices[0].message.content });
  }
  