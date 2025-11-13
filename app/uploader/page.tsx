"use client";

import { useEffect, useState } from "react";
import CameraInput from "@/lib/CameraInput";

type SessionInfo = {
  user?: {
    email?: string;
    name?: string | null;
    image?: string | null;
  };
  accessToken?: string;
  [key: string]: any;
};

export default function UploaderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/debug-session");
        if (!res.ok) {
          const text = await res.text();
          setSessionError(`Failed to load session: ${text}`);
          return;
        }
        const json = await res.json();
        setSessionInfo(json);
      } catch (err) {
        console.error(err);
        setSessionError("Error loading session");
      }
    };

    loadSession();
  }, []);

  const handlePick = (f: File) => {
    setFile(f);
    setStatus(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Uploading...");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Upload failed:", text);
        setStatus("Upload failed: " + text);
        return;
      }

      const json = await res.json();
      setStatus(`Uploaded: ${json.name ?? json.id}`);
      setFile(null);
    } catch (err) {
      console.error(err);
      setStatus("Upload error");
    }
  };

  const email = sessionInfo?.user?.email ?? "(none)";
  const accessToken = sessionInfo?.accessToken as string | undefined;

  return (
    <div className="min-h-screen flex flex-col gap-4 p-4 items-center justify-start">
      <h1 className="text-xl font-semibold mb-4">8ball Uploader</h1>

      {/* SESSION DEBUG BOX */}
      <div className="w-full max-w-xl p-4 border rounded bg-gray-50 text-sm text-gray-900">
        <p>
          <strong>Session load:</strong>{" "}
          {sessionError
            ? `Error: ${sessionError}`
            : sessionInfo
            ? "OK"
            : "Loading..."}
        </p>
        <p>
          <strong>Email:</strong> {email}
        </p>
        <p>
          <strong>Access Token:</strong>{" "}
          {accessToken
            ? accessToken.substring(0, 12) + "...(masked)"
            : "(none)"}
        </p>

        <details className="mt-2">
          <summary className="cursor-pointer text-blue-600">
            Show Full Session JSON
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
{JSON.stringify(sessionInfo ?? {}, null, 2)}
          </pre>
        </details>
      </div>

      {/* CAMERA PICKER */}
      <CameraInput onPick={handlePick} />

      {/* UPLOAD BUTTON */}
      <button
        onClick={handleUpload}
        disabled={!file}
        className="rounded-md border border-zinc-400 px-4 py-2 text-base disabled:opacity-50 hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        {file ? "Upload to Drive" : "Pick a photo first"}
      </button>

      {status && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{status}</p>
      )}
    </div>
  );
}
