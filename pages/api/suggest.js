export default async function handler(req, res) {
    if (req.method === "POST") {
      const { csvData } = req.body;
  
      const prompt = `
  You are given a table of student performance data:\n${JSON.stringify(csvData)}\n
  1. Identify subjects where the average performance is low (below 50%).
  2. For each weak subject, provide 1 practical tip that students can apply to improve.
  3. Keep the suggestions brief, smart, and useful for students.
  4. At the end, give 2-3 general study improvement tips that apply to all students.
  Avoid long paragraphs. Use bullet points or a numbered list for clarity.
  `;
  
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
              {
                role: "system",
                content: "You are an educational counselor. Provide data-driven learning improvement tips.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        });
  
        const result = await response.json();
  
        const suggestion = result.choices?.[0]?.message?.content || "No suggestion received.";
        res.status(200).json({ suggestion });
  
      } catch (error) {
        console.error("Groq API error:", error);
        res.status(500).json({ suggestion: "Error generating suggestions." });
      }
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  }
  