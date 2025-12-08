"use client";

import type { LocalUpload, MediaObject } from "@/types/media";
import React from "react";

interface MediaGalleryProps {
    items: MediaObject[];
    uploads: LocalUpload[];
    onDelete: (key: string) => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
                                                              items,
                                                              uploads,
                                                              onDelete,
                                                          }) => {
    const allItems = [
        ...uploads,
    ];

    return (
        <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Media Gallery</h2>
                <span className="text-xs text-slate-400">
                    {items.length} stored · {uploads.length} uploading
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {uploads.map((upload) => (
                    <div
                        key={upload.id}
                        className="group relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70"
                    >
                        <div className="aspect-square overflow-hidden bg-slate-800">
                            <img
                                src={upload.previewUrl}
                                alt={upload.file.name}
                                className="h-full w-full object-cover opacity-80"
                            />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 p-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="truncate text-slate-200">
                                  {upload.file.name}
                                </span>
                                <span className="ml-2 shrink-0 text-slate-400">
                                  {upload.progress}%
                                </span>
                            </div>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-700">
                                <div
                                    className={`h-full rounded-full ${
                                        upload.status === "error"
                                            ? "bg-red-500"
                                            : upload.status === "success"
                                                ? "bg-green-500"
                                                : "bg-blue-500"
                                    }`}
                                    style={{ width: `${upload.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {items.map((item) => (
                    <div
                        key={item.key}
                        className="group relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70"
                    >
                        <div className="aspect-square overflow-hidden bg-slate-800">
                            <img
                                src={item.url}
                                alt={item.key}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                        </div>
                        <button
                            onClick={() => onDelete(item.key)}
                            className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-1 text-xs text-slate-100 opacity-0 shadow-sm transition group-hover:opacity-100"
                        >
                            Delete
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 p-1.5 text-[10px] text-slate-300">
                            <span className="line-clamp-1 break-all">{item.key}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
