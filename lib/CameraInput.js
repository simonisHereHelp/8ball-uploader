"use client";

import { useRef, useState } from "react";

export default function CameraInput({ onPick }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    onPick(f);
  };

  return (
    <div className="grid">
      <input
        ref={ref}
        className="input"
        style={{ padding: 0 }}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
      />
      {preview && <img className="preview" src={preview} alt="preview" />}
    </div>
  );
}
