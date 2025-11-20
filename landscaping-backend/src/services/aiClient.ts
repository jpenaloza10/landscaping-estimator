import "dotenv/config";

const AI_MODEL = process.env.AI_MODEL || "gpt-4.1-mini"; // adjust to your provider
const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const AI_API_URL =
  process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";

if (!AI_API_KEY) {
  console.warn(
    "[AI] Missing AI_API_KEY / OPENAI_API_KEY – AI routes will throw until configured."
  );
}

export async function callAI(prompt: string): Promise<string> {
  if (!AI_API_KEY) {
    throw new Error("AI API key not configured");
  }

  const res = await fetch(AI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant for a landscaping construction estimating app. " +
            "You help a contractor review estimates, expenses, profit and write proposal text. " +
            "Be concise, avoid hallucinating prices or laws, and prefer neutral, factual wording.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API error: ${res.status} – ${text}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("AI response missing content");
  }
  return content.trim();
}
