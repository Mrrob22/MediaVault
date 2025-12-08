"use client";

import React from "react";
import type { LocalUpload } from "@/types/media";

interface UploadDropzoneProps {
    onOptimisticAdd: (upload: LocalUpload) => void;
    onUploadSuccess: (key: string) => void;
    onUploadError: (key: string, error: string) => void;
}

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
                                                                  onOptimisticAdd,
                                                                  onUploadSuccess,
                                                                  onUploadError,
                                                              }) => {
    const [dragActive, setDragActive] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (!files.length) return;
        handleFiles(files);
    };

    const handleFilesFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        handleFiles(files);
        e.target.value = "";
    };

    const handleFiles = (files: File[]) => {
        files.forEach((file) => {
            const error = validateFile(file);
            if (error) {
                alert(error);
                return;
            }
            uploadFile(file);
        });
    };

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return `Unsupported file type: ${file.type}. Images only.`;
        }
        if (file.size > MAX_SIZE_BYTES) {
            return `File ${file.name} is larger than ${MAX_SIZE_MB}MB.`;
        }
        return null;
    };

    const uploadFile = async (file: File) => {
        const res = await fetch("/api/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
            }),
        });

        if (!res.ok) {
            const msg = "Failed to get upload URL";
            console.error(msg);
            return;
        }

        const { uploadUrl, key } = (await res.json()) as {
            uploadUrl: string;
            key: string;
        };

        const id = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);

        const optimisticUpload: LocalUpload = {
            id,
            file,
            key,
            previewUrl,
            progress: 0,
            status: "uploading",
        };

        onOptimisticAdd(optimisticUpload);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                const customEvent = new CustomEvent("upload-progress", {
                    detail: { key, progress },
                });
                window.dispatchEvent(customEvent);
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onUploadSuccess(key);
            } else {
                const error = `Upload failed with status ${xhr.status}`;
                console.error(error);
                onUploadError(key, error);
            }
            URL.revokeObjectURL(previewUrl);
        });

        xhr.addEventListener("error", () => {
            const error = "Network error during upload";
            console.error(error);
            onUploadError(key, error);
            URL.revokeObjectURL(previewUrl);
        });

        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <div
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                    dragActive
                        ? "border-blue-500 bg-slate-800/50"
                        : "border-slate-700 bg-slate-900"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <p className="mb-2 text-sm font-medium">
                    Drag &amp; drop images here, or click to select
                </p>
                <p className="text-xs text-slate-400">
                    Images only · Max size {MAX_SIZE_MB}MB · Multiple files allowed
                </p>
            </div>
            <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFilesFromInput}
            />
        </div>
    );
};
