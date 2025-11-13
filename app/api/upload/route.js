// app/api/upload/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req) {
  const session = await auth();

  if (!session || session.user?.email !== "99.cent.bagel@gmail.com") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // DEBUG (temporarily): log what session looks like on the server
  console.log("upload session:", JSON.stringify(session, null, 2));

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return new NextResponse("No file uploaded", { status: 400 });
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return new NextResponse("Missing GOOGLE_DRIVE_FOLDER_ID", { status: 500 });
  }

  // Be strict about where we read the token from
  const accessToken =
    session.accessToken ||
    (session.token && session.token.accessToken) ||
    null;

  if (!accessToken) {
    console.error("Upload: session has no accessToken", session);
    return new NextResponse("Missing Drive access token", { status: 500 });
  }

  // ... rest of your code (sharp + upload) stays the same ...
}
