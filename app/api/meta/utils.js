import { uploadToDrive } from "@/lib/drive";
import { createChatCompletion } from "@/lib/openai";

const TAGGING_PROMPT =
`
  你是一個文件助理，你紀錄文件的重點。請做出三個重點。輸出文本格式，以下是範例格式

  【標題】文件的標題 （如：XXX申請表）
  【手寫的内容】任何手工寫的内容（如：名字，簽名）
  【摘要】陳獻堂，兆豐銀行代扣申請書，民114年11月20日
  
`

export async function saveMeta({ accessToken, folderId, fileName }) {
  const baseName = fileName.replace(/\.[^./]+$/, "");
  const metaName = `${baseName}_meta.json`;
    const sumOutput = await createChatCompletion([
    { role: "system", content: TAGGING_PROMPT },
    {
      role: "user",
      content: `請根據文件 "${fileName}" 的內容，請輸出文本内容，該内容包含三個段落：【標題】、【手寫內容】、【摘要】。`,
    },
  ]);

  const metaBuffer = Buffer.from(
    JSON.stringify({
      uploadedAt: new Date().toISOString(),
      prompt: TAGGING_PROMPT,
      sumOutput,
    })
  );

  const metaJson = await uploadToDrive({
    accessToken,
    folderId,
    name: metaName,
    buffer: metaBuffer,
    mimeType: "application/json",
  });

  console.log("====== response: tags ======");
  console.log(sumOutput);
  console.log("================================");
  
  return {
    id: metaJson.id,
    name: metaJson.name,
  };
}