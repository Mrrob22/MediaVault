export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface MediaObject {
    key: string;
    url: string;
    size: number | null;
    lastModified: string | null;
}

export interface LocalUpload {
    id: string;
    file: File;
    key: string;
    previewUrl: string;
    progress: number;
    status: UploadStatus;
    error?: string;
}
