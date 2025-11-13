// app/api/upload/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// If you don't use sharp now, you can remove runtime override.
// export const runtime = "nodejs";

export async function POST(req) {
  try {
    // 1) Auth & email gate
    const session = await auth();

    if (!session || session.user?.email !== "99.cent.bagel@gmail.com") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const accessToken = session.accessToken;
    if (!accessToken) {
      console.error("Upload: session has no accessToken", session);
      return new NextResponse("Missing Drive access token on session", {
        status: 500,
      });
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      console.error("Upload: GOOGLE_DRIVE_FOLDER_ID is not set");
      return new NextResponse("Missing GOOGLE_DRIVE_FOLDER_ID", {
        status: 500,
      });
    }

    // 2) Read file from form-data
    const formData = await req.formData();
    const file = formData.get("file");

    // In Node runtime, `File` may not exist globally, so don't use `instanceof File`
    if (!file || typeof file === "string") {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "application/octet-stream";
    const fileName = file.name || "upload";

    // 3) Build multipart body for Drive upload
    const boundary = "drive-boundary-" + Date.now();
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const body = buildMultipartBody(boundary, metadata, buffer, mimeType);

    // 4) Upload to Google Drive
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
      return new NextResponse("Drive upload failed: " + text, {
        status: 500,
      });
    }

    const json = await res.json();

    return NextResponse.json({
      id: json.id,
      name: json.name,
      webViewLink: json.webViewLink,
      webContentLink: json.webContentLink,
    });
  } catch (err) {
    console.error("Upload route error", err);
    const msg =
      err && typeof err === "object" && "message" in err
        ? err.message
        : String(err);
    return new NextResponse("Upload route error: " + msg, { status: 500 });
  }
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
