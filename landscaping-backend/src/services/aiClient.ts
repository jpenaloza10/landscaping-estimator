import "dotenv/config";


const PROVIDER = (process.env.AI_PROVIDER || "groq").toLowerCase();

const AI_API_KEY =
  process.env.AI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  null;

// Default URL for Groq (OpenAI-compatible API)
const DEFAULT_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Choose API URL based on provider
const AI_API_URL =
  process.env.AI_API_URL ||
  (PROVIDER === "openai"
    ? "https://api.openai.com/v1/chat/completions"
    : DEFAULT_GROQ_URL);

// Updated model – use a currently supported Groq model
const AI_MODEL =
  process.env.AI_MODEL ||
  (PROVIDER === "openai" ? "gpt-4.1-mini" : "llama-3.3-70b-versatile");

if (!AI_API_KEY) {
  console.warn(
    "[AI] No AI_API_KEY or OPENAI_API_KEY found — AI routes will fail until provided."
  );
}

/**
 * ======================================================
 *  callAI(prompt: string)
 * ======================================================
 * Sends a Chat Completion request to Groq (or OpenAI fallback).
 */
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
    throw new Error(
      `[AI] Provider error (${res.status}) → ${text}\nURL=${AI_API_URL}`
    );
  }

  const json = await res.json();

  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    console.error("[AI] Unexpected response JSON:", json);
    throw new Error("AI response missing content");
  }

  return content.trim();
}
