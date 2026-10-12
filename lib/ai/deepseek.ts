type TextMessage = { role: "system" | "user" | "assistant"; content: string };
type ImageMessage = {
  role: "user";
  content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "auto" } }
  >;
};

export type DeepSeekMessage = TextMessage | ImageMessage;

// DeepSeek retired its V3.2 API aliases in July 2026. Its current Flash API
// model supports text and images, so both tutor and quiz calls use this model.
const model = process.env.DEEPSEEK_MODEL || "deepseek-flash";
const endpoint = "https://api.deepseek.com/chat/completions";

export async function generateWithDeepSeek(messages: DeepSeekMessage[], options: {
  maxTokens?: number;
  json?: boolean;
} = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured.");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      max_tokens: options.maxTokens ?? 2048,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null) as {
    choices?: Array<{ message?: { content?: unknown } }>;
    error?: { message?: string };
  } | null;
  if (!response.ok) {
    console.error("[deepseek] request failed", response.status, payload?.error?.message ?? "No error details");
    throw new Error("DeepSeek could not answer right now. Check the API key and model configuration.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content.trim()
    : Array.isArray(content)
      ? content.flatMap((part) => part && typeof part === "object" && "text" in part && typeof part.text === "string" ? [part.text] : []).join("\n").trim()
      : "";
  if (!text) throw new Error("DeepSeek returned an empty response.");
  return text;
}

export function imageDataUrl(mimeType: string, data: string) {
  return `data:${mimeType};base64,${data}`;
}

export function getDeepSeekModel() {
  return model;
}
