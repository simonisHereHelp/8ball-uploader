const DEFAULT_CHAT_COMPLETIONS_PATH = "/v1/chat/completions";

function resolveApiUrl() {
  const base = process.env.OPENAI_BASE_URL?.replace(/\/$/, "");
  if (base) {
    return `${base}${DEFAULT_CHAT_COMPLETIONS_PATH}`;
  }

  const explicit = process.env.OPENAI_CHAT_COMPLETIONS_URL;
  if (explicit) {
    return explicit;
  }

  return `https://api.openai.com${DEFAULT_CHAT_COMPLETIONS_PATH}`;
}

export async function createChatCompletion(messages, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 200,
      messages,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}): ${errorPayload.slice(0, 200)}`
    );
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("OpenAI response did not include any text.");
  }

  return text;
}
