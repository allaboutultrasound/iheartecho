/**
 * Test script: call the Forge API directly with the QuickFire AI generator prompt
 * and log the raw response to diagnose JSON parse failures.
 */
import { config } from "dotenv";
config({ path: ".env" });

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error("Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY");
  process.exit(1);
}

const baseURL = `${FORGE_API_URL.replace(/\/+$/, "")}/v1`;

const prompt = `You are an expert echocardiography educator creating 3 intermediate scenario questions about: "aortic stenosis".
Each item is a multiple-choice question with exactly 4 options in 'options', a 0-indexed correctAnswer as a number (0, 1, 2, or 3), and a clear explanation. Do NOT include reviewAnswer.
Guidelines:
- Use accurate, up-to-date ASE/AHA/ACC guidelines where applicable
- Questions should be clinically relevant and educational
- For MCQ: distractors should be plausible but clearly distinguishable from the correct answer
- Tags: 2-4 specific clinical terms (e.g. "aortic stenosis", "ASE 2021", "Doppler")
- Difficulty: intermediate (beginner=basic concepts, intermediate=clinical application, advanced=complex interpretation)
Return exactly 3 questions as a valid JSON object matching this format:
{"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","tags":["...","..."]}]}
Return ONLY the JSON object, no markdown, no explanation, no code fences.`;

console.log("Calling Forge API at:", baseURL);
console.log("---");

try {
  const resp = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  const data = await resp.json();
  console.log("HTTP status:", resp.status);
  console.log("Response keys:", Object.keys(data));

  if (data.error) {
    console.error("API error:", JSON.stringify(data.error, null, 2));
    process.exit(1);
  }

  const text = data.choices?.[0]?.message?.content ?? "";
  console.log("\n=== RAW MODEL OUTPUT ===");
  console.log(JSON.stringify(text));
  console.log("\n=== FIRST 500 CHARS ===");
  console.log(text.substring(0, 500));

  // Try to parse
  let cleaned = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
  const jsonMatch = cleaned.match(/([\[\{][\s\S]*[\]\}])/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();

  console.log("\n=== CLEANED (first 500 chars) ===");
  console.log(cleaned.substring(0, 500));

  try {
    const parsed = JSON.parse(cleaned);
    console.log("\n=== PARSE SUCCESS ===");
    console.log("Type:", Array.isArray(parsed) ? "array" : typeof parsed);
    if (Array.isArray(parsed)) {
      console.log("Questions count:", parsed.length);
    } else if (parsed.questions) {
      console.log("Questions count:", parsed.questions.length);
    }
  } catch (e) {
    console.error("\n=== PARSE FAILED ===");
    console.error("Error:", e.message);
    console.error("Cleaned text (full):", cleaned);
  }
} catch (err) {
  console.error("Fetch error:", err.message);
}
