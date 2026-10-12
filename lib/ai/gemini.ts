import type { DeepSeekMessage } from "@/lib/ai/deepseek";

const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

function toGeminiContents(messages: DeepSeekMessage[]) {
  return messages.flatMap((message) => {
    if (message.role === "system") return [];
    const role = message.role === "assistant" ? "model" : "user";
    if (typeof message.content === "string") {
      return [{ role, parts: [{ text: message.content }] }];
    }

    const parts: GeminiPart[] = [];
    for (const part of message.content) {
      if (part.type === "text") {
        parts.push({ text: part.text });
        continue;
      }
      const match = part.image_url.url.match(/^data:([^;]+);base64,([\s\S]+)$/);
      if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }
    return parts.length ? [{ role, parts }] : [];
  });
}

export async function generateWithGemini(messages: DeepSeekMessage[], maxOutputTokens = 2048) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini backup is not configured.");

  const systemInstruction = messages.find((message) => message.role === "system");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        ...(systemInstruction && typeof systemInstruction.content === "string"
          ? { systemInstruction: { parts: [{ text: systemInstruction.content }] } }
          : {}),
        contents: toGeminiContents(messages),
        generationConfig: { maxOutputTokens },
      }),
      signal: AbortSignal.timeout(90_000),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
  } | null;
  if (!response.ok) {
    console.error("[gemini] backup request failed", response.status);
    throw new Error("Gemini could not answer right now.");
  }

  const answer = payload?.candidates?.[0]?.content?.parts
    ?.flatMap((part) => typeof part.text === "string" ? [part.text] : [])
    .join("\n")
    .trim();
  if (!answer) throw new Error("Gemini returned an empty response.");
  return answer;
}

export function getGeminiModel() {
  return model;
}
