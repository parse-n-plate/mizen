import Groq from "groq-sdk";

// Groq retired llama-3.3-70b-versatile on August 16, 2026.
// Keep text model selection in one place so all extraction paths stay aligned.
export const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";

let _client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!_client) {
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
}

export function extractJsonFromAiResponse(text: string): unknown {
  if (!text || text.trim().length === 0) return null;

  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Continue to fence stripping
  }

  // Strip markdown code fences
  const fencePatterns = [/```json\s*([\s\S]*?)```/i, /```\s*([\s\S]*?)```/];

  for (const pattern of fencePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        continue;
      }
    }
  }

  // Try to find JSON object in text
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch {
      // Fall through
    }
  }

  return null;
}
