import { uploadToDrive } from "@/lib/drive";
import { createChatCompletion } from "@/lib/openai";

const TAGGING_PROMPT =
  "you are a image tagging agent. Tag this image with no more than 50 words.";

export async function saveMeta({ accessToken, folderId, fileName }) {
  const baseName = fileName.replace(/\.[^./]+$/, "");
  const metaName = `${baseName}_meta.json`;
    const tags = await createChatCompletion([
    { role: "system", content: TAGGING_PROMPT },
    {
      role: "user",
      content: `Provide helpful descriptive tags for the uploaded image named "${fileName}".`,
    },
  ]);

  const metaBuffer = Buffer.from(
    JSON.stringify({
      uploadedAt: new Date().toISOString(),
      prompt: TAGGING_PROMPT,
      tags,
    })
  );

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