import { uploadToDrive } from "@/lib/drive";
import { createChatCompletion } from "@/lib/openai";

const TAGGING_PROMPT = `
你是一個文件助理。你的任務是：
1. 先對提供的圖片進行 OCR，完整擷取大字、表頭、欄位名稱、手寫內容。
2. 根據 OCR 的內容，輸出以下三段格式（純文字）：

【標題】文件中的大字、標題、表頭、章節名稱
【手寫的內容】所有手寫文字（姓名、日期、數字、簽名、補寫內容）
【摘要】一句話總結文件內容（如：申請人、文件類型、日期）

注意：
- 不能說「無法查看圖片」。你一定能讀取圖片內容。
- 所有輸出必須使用繁體中文。
`.trim();

export async function saveMeta({ accessToken, folderId, fileName }) {
  const baseName = fileName.replace(/\.[^./]+$/, "");
  const metaName = `${baseName}_meta.json`;
  const imageUrl = `https://drive.google.com/uc?export=view&id=${baseName}`;

  const gptOutput = await createChatCompletion(
    [
      { role: "system", content: TAGGING_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: `請使用 OCR 分析此文件影像，並依照三段格式回覆。檔案名稱：「${fileName}」` },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" }, // 👈 GPT-4o Vision OCR
          },
        ],
      },
    ],
    { maxTokens: 1000, temperature: 0.2 }
  );

  const metaObject = {
    uploadedAt: new Date().toISOString(),
    fileName,
    output: gptOutput,      // OCR + 三段摘要
    prompt: TAGGING_PROMPT,
    sourceImage: imageUrl,  // debugging convenience
  };

  const metaJson = await uploadToDrive({
    accessToken,
    folderId,
    name: metaName,
    buffer: Buffer.from(JSON.stringify(metaObject, null, 2)),
    mimeType: "application/json",
  });

  console.log("====== response: tags ======");
  console.log(gptOutPut);
  console.log("================================");
  
  return {
    id: metaJson.id,
    name: metaJson.name,
  };
}