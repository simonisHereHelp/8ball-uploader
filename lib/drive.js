export function buildMultipartBody(boundary, metadata, fileBuffer, mimeType) {
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata);

  const filePartHeader =
    delimiter + `Content-Type: ${mimeType}\r\n\r\n`;

  const endPart = closeDelimiter;

  return Buffer.concat([
    Buffer.from(metaPart, "utf8"),
    Buffer.from(filePartHeader, "utf8"),
    fileBuffer,
    Buffer.from(endPart, "utf8"),
  ]);
}

export async function uploadToDrive({ accessToken, folderId, name, buffer, mimeType }) {
  const boundary = "drive-boundary-" + Date.now() + Math.random().toString(16);
  const metadata = {
    name,
    parents: [folderId],
  };

  const body = buildMultipartBody(boundary, metadata, buffer, mimeType);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Drive upload failed", res.status, text);
    throw new Error("Drive upload failed: " + text);
  }

  return res.json();
}