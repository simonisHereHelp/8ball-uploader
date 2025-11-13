// lib/InfiniteAlbumDrive.tsx
"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo, useRef } from "react";

const PAGE_SIZE = 12;

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

const getKey = (pageIndex: number, prev: any) => {
  if (prev && !prev.hasMore) return null;
  const offset = pageIndex * PAGE_SIZE;
  return `/api/album-drive?offset=${offset}&limit=${PAGE_SIZE}`;
};

export default function InfiniteAlbumDrive() {
  const { data, size, setSize, isValidating, error } = useSWRInfinite(
    getKey,
    fetcher
  );

  const items = useMemo(
    () => (data ?? []).flatMap((p: any) => p.items),
    [data]
  );
  const hasMore = !!data?.[data.length - 1]?.hasMore;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isValidating) {
          setSize((s) => s + 1);
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [hasMore, isValidating, setSize]);

  return (
    <div className="space-y-4">
      {/* ✅ Always single column layout */}
      <div className="grid grid-cols-1 gap-4">
        {items.map((it: any) => (
          <figure
            key={it.id}
            className="flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden"
          >
            <div className="w-full aspect-[4/3] bg-neutral-100">
              <img
                src={it.url}
                alt={it.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <figcaption className="px-2 py-2 text-xs text-neutral-800">
              <div className="font-medium truncate">{it.title}</div>
              <div className="text-neutral-500">
                {new Date(it.createdAt).toLocaleString()}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div
        ref={sentinelRef}
        className="h-8 flex items-center justify-center text-sm text-neutral-400"
      >
        {hasMore
          ? isValidating
            ? "Loading…"
            : "Scroll for more"
          : "No more images"}
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          Error: {String(error.message || error)}
        </div>
      )}
    </div>
  );
}
