import { describe, it, expect } from "vitest";
import { extractJsonFromAiResponse, GROQ_TEXT_MODEL, GROQ_VISION_MODEL } from "../groq";

describe("GROQ_TEXT_MODEL", () => {
  it("uses Groq's supported production replacement for the retired Llama model", () => {
    expect(GROQ_TEXT_MODEL).toBe("openai/gpt-oss-120b");
  });
});

describe("GROQ_VISION_MODEL", () => {
  it("uses Groq's supported vision replacement for retired Llama 4 Scout", () => {
    expect(GROQ_VISION_MODEL).toBe("qwen/qwen3.6-27b");
  });
});

describe("extractJsonFromAiResponse", () => {
  it("returns null for empty string", () => {
    expect(extractJsonFromAiResponse("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(extractJsonFromAiResponse("   ")).toBeNull();
  });

  it("parses plain JSON directly", () => {
    const json = '{"title":"Pasta","ingredients":[]}';
    expect(extractJsonFromAiResponse(json)).toEqual({ title: "Pasta", ingredients: [] });
  });

  it("strips ```json code fence", () => {
    const text = '```json\n{"title":"Pasta"}\n```';
    expect(extractJsonFromAiResponse(text)).toEqual({ title: "Pasta" });
  });

  it("strips plain ``` code fence", () => {
    const text = '```\n{"title":"Pasta"}\n```';
    expect(extractJsonFromAiResponse(text)).toEqual({ title: "Pasta" });
  });

  it("extracts JSON object embedded in surrounding text", () => {
    const text = 'Here is the recipe: {"title":"Soup"} — enjoy!';
    expect(extractJsonFromAiResponse(text)).toEqual({ title: "Soup" });
  });

  it("returns null when no valid JSON found", () => {
    expect(extractJsonFromAiResponse("No recipe found here")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(extractJsonFromAiResponse("{bad json}")).toBeNull();
  });
});
