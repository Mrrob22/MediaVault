"use client";

import React from "react";
import type { LocalUpload } from "@/types/media";

interface UploadDropzoneProps {
    onOptimisticAdd: (upload: LocalUpload) => void;
    onUploadSuccess: (key: string) => void;
    onUploadError: (key: string, error: string) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const MULTIPART_THRESHOLD = 50 * 1024 * 1024;
const MULTIPART_CHUNK_SIZE = 8 * 1024 * 1024;

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
            uploadFile(file).catch((err) => {
                console.error(err);
            });
        });
    };

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return `Unsupported file type: ${file.type}. Images only.`;
        }
        return null;
    };

    const uploadFile = async (file: File) => {
        if (file.size >= MULTIPART_THRESHOLD) {
            await uploadFileMultipart(file);
        } else {
            await uploadFileSingle(file);
        }
    };

    const uploadFileSingle = async (file: File) => {
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
            alert(msg);
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
                dispatchProgress(key, progress);
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

    const uploadFileMultipart = async (file: File) => {
        const startRes = await fetch("/api/multipart/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
            }),
        });

        if (!startRes.ok) {
            const msg = "Failed to start multipart upload";
            console.error(msg);
            alert(msg);
            return;
        }

        const { uploadId, key } = (await startRes.json()) as {
            uploadId: string;
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

        const totalSize = file.size;
        let uploadedBytes = 0;
        const parts: { ETag: string; PartNumber: number }[] = [];

        const partCount = Math.ceil(totalSize / MULTIPART_CHUNK_SIZE);

        for (let partNumber = 1; partNumber <= partCount; partNumber++) {
            const start = (partNumber - 1) * MULTIPART_CHUNK_SIZE;
            const end = Math.min(start + MULTIPART_CHUNK_SIZE, totalSize);
            const blob = file.slice(start, end);

            const partUrlRes = await fetch("/api/multipart/part-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, uploadId, partNumber }),
            });

            if (!partUrlRes.ok) {
                const error = `Failed to get part URL for part ${partNumber}`;
                console.error(error);
                onUploadError(key, error);
                URL.revokeObjectURL(previewUrl);
                return;
            }

            const { url } = (await partUrlRes.json()) as { url: string };

            const eTag = await uploadPartXHR(url, blob, key, uploadedBytes, totalSize);
            uploadedBytes += blob.size;

            parts.push({ ETag: eTag, PartNumber: partNumber });
        }

        const completeRes = await fetch("/api/multipart/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, uploadId, parts }),
        });

        if (!completeRes.ok) {
            const error = "Failed to complete multipart upload";
            console.error(error);
            onUploadError(key, error);
            URL.revokeObjectURL(previewUrl);
            return;
        }

        dispatchProgress(key, 100);
        onUploadSuccess(key);
        URL.revokeObjectURL(previewUrl);
    };

    const uploadPartXHR = (
        url: string,
        blob: Blob,
        key: string,
        alreadyUploaded: number,
        total: number
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    const current = alreadyUploaded + event.loaded;
                    const progress = Math.round((current / total) * 100);
                    dispatchProgress(key, progress);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const eTag = xhr.getResponseHeader("ETag");
                    if (!eTag) {
                        reject(new Error("No ETag returned for part"));
                        return;
                    }
                    resolve(eTag.replace(/"/g, ""));
                } else {
                    reject(new Error(`Part upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener("error", () => {
                reject(new Error("Network error during part upload"));
            });

            xhr.open("PUT", url, true);
            xhr.send(blob);
        });
    };

    const dispatchProgress = (key: string, progress: number) => {
        const customEvent = new CustomEvent("upload-progress", {
            detail: { key, progress },
        });
        window.dispatchEvent(customEvent);
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
                    Images only · Normal uploads &lt; 50MB use single PUT · Files ≥ 50MB
                    use multipart upload
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
