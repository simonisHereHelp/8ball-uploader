import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveMeta } from "./utils";

export async function POST(req) {
  try {
    const session = await auth();

    if (!session || session.user?.email !== "99.cent.bagel@gmail.com") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const accessToken = session.accessToken;
    if (!accessToken) {
      console.error("Meta: session has no accessToken", session);
      return new NextResponse("Missing Drive access token on session", {
        status: 500,
      });
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      console.error("Meta: GOOGLE_DRIVE_FOLDER_ID is not set");
      return new NextResponse("Missing GOOGLE_DRIVE_FOLDER_ID", {
        status: 500,
      });
    }

    const body = await req.json();
    const fileName = body?.fileName;
    if (!fileName || typeof fileName !== "string") {
      return new NextResponse("fileName is required", { status: 400 });
    }

    const meta = await saveMeta({ accessToken, folderId, fileName });

    return NextResponse.json(meta);
  } catch (err) {
    console.error("Meta route error", err);
    const msg =
      err && typeof err === "object" && "message" in err
        ? err.message
        : String(err);
    return new NextResponse("Meta route error: " + msg, { status: 500 });
  }
}