"use client";

import React from "react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { MediaGallery } from "@/components/MediaGallery";
import type { LocalUpload, MediaObject } from "@/types/media";

export default function HomePage() {
  const [uploads, setUploads] = React.useState<LocalUpload[]>([]);
  const [items, setItems] = React.useState<MediaObject[]>([]);
  const [loadingList, setLoadingList] = React.useState(false);

  const refreshList = React.useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/media/list", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch media list");
      const data = (await res.json()) as { items: MediaObject[] };
      setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    refreshList();
  }, [refreshList]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; progress: number }>)
          .detail;
      setUploads((prev) =>
          prev.map((u) =>
              u.key === detail.key ? { ...u, progress: detail.progress } : u
          )
      );
    };
    window.addEventListener("upload-progress", handler as EventListener);
    return () => {
      window.removeEventListener("upload-progress", handler as EventListener);
    };
  }, []);

  const handleOptimisticAdd = (upload: LocalUpload) => {
    setUploads((prev) => [...prev, upload]);
  };

  const handleUploadSuccess = (key: string) => {
    setUploads((prev) =>
        prev.map((u) =>
            u.key === key ? { ...u, status: "success", progress: 100 } : u
        )
    );
    setTimeout(() => {
      refreshList();
      setUploads((prev) => prev.filter((u) => u.key !== key));
    }, 800);
  };

  const handleUploadError = (key: string, error: string) => {
    setUploads((prev) =>
        prev.map((u) =>
            u.key === key ? { ...u, status: "error", error } : u
        )
    );
  };

  const handleDelete = async (key: string) => {
    const confirmed = confirm("Delete this file?");
    if (!confirmed) return;
    try {
      const res = await fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setItems((prev) => prev.filter((i) => i.key !== key));
    } catch (err) {
      console.error(err);
      alert("Failed to delete file");
    }
  };

  return (
      <main>
        <UploadDropzone
            onOptimisticAdd={handleOptimisticAdd}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
        />

        <div className="mt-4 text-xs text-slate-400">
          {loadingList ? "Refreshing media list…" : "\u00A0"}
        </div>

        <MediaGallery items={items} uploads={uploads} onDelete={handleDelete} />
      </main>
  );
}
