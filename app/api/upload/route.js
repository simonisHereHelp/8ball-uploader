import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sharp from "sharp";

export const runtime = "nodejs"; // required for sharp

export async function POST(req) {
  const session = await auth();

  // Only allow your Gmail account
  if (!session || session.user?.email !== "99.cent.bagel@gmail.com") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return new NextResponse("No file uploaded", { status: 400 });
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return new NextResponse("Missing GOOGLE_DRIVE_FOLDER_ID", { status: 500 });
  }

  const accessToken = session.accessToken || session.access_token;
  if (!accessToken) {
    return new NextResponse("Missing Drive access token", { status: 500 });
  }

  // Convert file to buffer
  let buffer = Buffer.from(await file.arrayBuffer());
  let mimeType = file.type || "application/octet-stream";
  let fileName = file.name || "upload";

  // Normalize extension
  const baseName = fileName.replace(/\.[^/.]+$/, "");

  // Convert HEIC / non-jpg/png to JPEG
  const isJpgOrPng =
    mimeType === "image/jpeg" || mimeType === "image/png";

  if (!isJpgOrPng) {
    buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
    mimeType = "image/jpeg";
    fileName = `${baseName}.jpg`;
  }

  // ---- Google Drive multipart body ----
  const boundary = "drive-boundary-" + Date.now();
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const body = buildMultipartBody(boundary, metadata, buffer, mimeType);

  // ---- Upload to Google Drive ----
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
    return new NextResponse("Drive upload failed", { status: 500 });
  }

  const json = await res.json();

  return NextResponse.json({
    id: json.id,
    name: json.name,
    webViewLink: json.webViewLink,
    webContentLink: json.webContentLink,
  });
}

function buildMultipartBody(boundary, metadata, fileBuffer, mimeType) {
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
