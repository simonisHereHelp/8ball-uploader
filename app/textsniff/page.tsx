"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Tesseract from "tesseract.js";

const HOT_WORDS = [
  "兆豐",
  "陳獻堂",
  "陽明山瓦斯",
  "臺北自來水",
  "中華電信",
];

type SniffBox = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
};

type FacingMode = "environment" | "user";

export default function TextSniffPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [sniffing, setSniffing] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [boxes, setBoxes] = useState<SniffBox[]>([]);
  const [status, setStatus] = useState<string>("Ready");
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hotWordRegex = useMemo(
    () => new RegExp(HOT_WORDS.map((w) => w.replace(/([.*+?^${}()|\[\]\\])/g, "\\$1")).join("|"), "i"),
    []
  );

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (cameraOn) {
      void startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      setStatus("Opening camera...");
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setStatus("Camera ready");
    } catch (err) {
      console.error(err);
      setError("Could not access camera");
      setStatus("Camera error");
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const handleSniff = async () => {
    if (!cameraOn) {
      setError("Turn on the camera first");
      return;
    }

    const canvas = captureFrame();
    if (!canvas) {
      setError("No frame available yet");
      return;
    }

    setSniffing(true);
    setStatus("Running OCR...");
    setOcrProgress(0);
    setBoxes([]);
    setError(null);

    try {
      const result = await Tesseract.recognize(canvas, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const matchedLines: SniffBox[] = result.data.lines
        .filter((line) => line.text && hotWordRegex.test(line.text))
        .map((line) => ({
          text: line.text,
          bbox: line.bbox,
          confidence: line.confidence,
        }));

      setBoxes(matchedLines);
      setStatus(
        matchedLines.length > 0
          ? `Found ${matchedLines.length} hot word match${matchedLines.length === 1 ? "" : "es"}`
          : "No hot words detected"
      );
    } catch (err) {
      console.error(err);
      setError("OCR failed");
      setStatus("Sniff error");
    } finally {
      setSniffing(false);
      setOcrProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-4 space-y-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">TextSniff</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Prototype workflow: turn on the camera, capture a frame, and sniff for hot words. Matches are boxed on the overlay.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">Hot Words:</span>
            {HOT_WORDS.map((word) => (
              <span key={word} className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-2 py-1">
                {word}
              </span>
            ))}
          </div>
        </header>

        <section className="space-y-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium" htmlFor="facingMode">
              Lens
            </label>
            <select
              id="facingMode"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={facingMode}
              onChange={(e) => setFacingMode(e.target.value as FacingMode)}
            >
              <option value="environment">Rear camera</option>
              <option value="user">Front camera</option>
            </select>

            <button
              onClick={startCamera}
              className="rounded-md border border-zinc-400 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Camera ON
            </button>
            <button
              onClick={handleSniff}
              disabled={!cameraOn || sniffing}
              className="rounded-md border border-emerald-500 text-emerald-700 px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
            >
              {sniffing ? "Sniffing..." : "Text Sniff ON"}
            </button>
          </div>

          <div className="relative bg-black/80 rounded-lg overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-800">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted
            />
            <div className="pointer-events-none absolute inset-0">
              {boxes.map((box, idx) => {
                const { x0, y0, x1, y1 } = box.bbox;
                const style = {
                  left: `${(x0 / (videoRef.current?.videoWidth || 1)) * 100}%`,
                  top: `${(y0 / (videoRef.current?.videoHeight || 1)) * 100}%`,
                  width: `${((x1 - x0) / (videoRef.current?.videoWidth || 1)) * 100}%`,
                  height: `${((y1 - y0) / (videoRef.current?.videoHeight || 1)) * 100}%`,
                } as const;

                return (
                  <div
                    key={`${box.text}-${idx}`}
                    className="absolute border-2 border-emerald-400 bg-emerald-400/10"
                    style={style}
                  >
                    <span className="absolute -top-6 left-0 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                      {box.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-sm space-y-1">
            <p className="font-medium">Status: {status}</p>
            {ocrProgress !== null && <p>OCR progress: {ocrProgress}%</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!cameraOn && (
              <p className="text-zinc-600 dark:text-zinc-400">
                Turn on the camera to capture a frame. Front and rear lenses are supported via the lens selector.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}