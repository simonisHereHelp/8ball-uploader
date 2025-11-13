// app/uploader/page.tsx
"use client";

import { useState } from "react";
import CameraInput from "@/lib/CameraInput"; // adjust path if needed

export default function UploaderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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
        setStatus("Upload failed");
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-semibold">8ball Uploader</h1>

      <CameraInput onPick={handlePick} />

      <button
        onClick={handleUpload}
        disabled={!file}
        className="rounded-md border border-zinc-400 px-4 py-2 text-base disabled:opacity-50 hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        {file ? "Upload to Drive" : "Pick a photo first"}
      </button>

      {status && <p className="text-sm text-zinc-700 dark:text-zinc-300">{status}</p>}
    </div>
  );
}
