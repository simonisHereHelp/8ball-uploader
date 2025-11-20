import { uploadToDrive } from "@/lib/drive";

export async function saveMeta({ accessToken, folderId, fileName }) {
  const baseName = fileName.replace(/\.[^./]+$/, "");
  const metaName = `${baseName}_meta.json`;
  const metaBuffer = Buffer.from(
    JSON.stringify({ uploadedAt: new Date().toISOString() })
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