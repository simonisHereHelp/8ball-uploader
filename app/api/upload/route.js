// app/api/upload/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToDrive } from "@/lib/drive";
import { saveMeta } from "../meta/utils";
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
    const json = await uploadToDrive({
      accessToken,
      folderId,
      name: fileName,
          buffer,
      mimeType,
    });

  const meta = await saveMeta({ accessToken, folderId, fileName });


  return NextResponse.json({
      id: json.id,
      name: json.name,
      webViewLink: json.webViewLink,
      webContentLink: json.webContentLink,
      meta,
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
