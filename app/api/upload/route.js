import { uploadToDrive } from "@/lib/drive";
import { createChatCompletion } from "@/lib/openai";

// 1 — Google Drive BASE_INFO.json URL (DIRECT DOWNLOAD FORMAT)
const BASE_INFO_URL =
  "https://drive.google.com/uc?export=download&id=1XJ_7_asGEp9n4CKOP9savw8kzMAb-gB6";

// 4 — NEW PROMPT
const TAGGING_PROMPT = `
You are a document tagging system.
The uploaded image is a personal document.
Your task is to use BASE_INFO as source reference to tag the image.
Produce concise structured tags under 100 words.
`.trim();

// 1/3 — Fetch BASE_INFO.json from Drive
async function fetchBaseInfo() {
  try {
    const res = await fetch(BASE_INFO_URL);

    if (!res.ok) {
      console.error("BASE_INFO fetch error:", res.status);
      return null;
    }

    const jsonText = await res.text();
    console.log("[BASE_INFO RAW]:", jsonText.slice(0, 300)); // 3—DISPLAY JSON (first 300 chars)

    return jsonText; // return as string for prompt embedding
  } catch (err) {
    console.error("Failed to fetch BASE_INFO:", err);
    return null;
  }
}

export async function saveMeta({ accessToken, folderId, fileName }) {
  const baseName = fileName.replace(/\.[^./]+$/, "");
  const metaName = `${baseName}_meta.json`;

  // 1/3 — load BASE_INFO.json
  const baseInfoText = await fetchBaseInfo();
  if (!baseInfoText) {
    console.warn("BASE_INFO missing; proceeding without it.");
  }

  // 4 — Build full user prompt
  const userPrompt = `
Tag the document image named "${fileName}".
Use the BASE_INFO content below as the authoritative reference.

BASE_INFO:
${baseInfoText ?? "[Missing BASE_INFO]"}
`.trim();

  // 4 — Call OpenAI with new tagging prompt
  const tags = await createChatCompletion(
    [
      { role: "system", content: TAGGING_PROMPT },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 300, temperature: 0.2 }
  );

  // 5 — Construct meta.json
  const metaJsonObject = {
    uploadedAt: new Date().toISOString(),
    prompt: TAGGING_PROMPT,
    baseInfoIncluded: !!baseInfoText,
    tags,
  };

  const metaBuffer = Buffer.from(JSON.stringify(metaJsonObject, null, 2));

  // 5 — Upload to Google Drive
  const metaJson = await uploadToDrive({
    accessToken,
    folderId,
    name: metaName,
    buffer: metaBuffer,
    mimeType: "application/json",
  });

  return {
    id: metaJson.id,
    name: metaJson.name,
  };
}
