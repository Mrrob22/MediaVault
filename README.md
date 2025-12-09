# Media Vault — Direct-to-S3 Upload System

A small but fully featured media management app built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **AWS S3**.

The goal of the project is to demonstrate a **Direct-to-Storage** upload flow:

- Files are uploaded **directly from the browser to S3** using **presigned PUT URLs**.
- Large files (50MB+) use **S3 Multipart Upload** with client-side chunking.
- Next.js API routes handle only **authorization and metadata**, never file binaries.
- Media can be **listed** and **deleted** via S3-backed endpoints.

---

## ✨ Features

### Frontend

- Custom drag-and-drop upload zone (no 3rd-party upload libraries).
- Client-side validation:
  - Images only (JPEG, PNG, WebP, GIF).
  - Size check before upload.
- Upload progress:
  - Real-time progress bar using `XMLHttpRequest.upload.onprogress`.
  - Smooth UI for 3–5 simultaneous uploads.
- Multipart / resumable uploads for large files (50MB+):
  - File is sliced into 8MB chunks in the browser.
  - Each chunk uploaded via its own presigned URL.
- Optimistic UI:
  - Preview of images appears immediately while upload is in progress.
- Responsive media gallery:
  - Grid layout showing uploaded images.
  - Delete action per item.

### Backend (Next.js App Router)

All backend logic lives in **Next.js API routes**:

- `POST /api/upload-url` — returns a **presigned PUT URL** and an S3 key.
- `POST /api/multipart/start` — starts multipart upload.
- `POST /api/multipart/part-url` — returns presigned URL for chunk upload.
- `POST /api/multipart/complete` — finalizes multipart upload.
- `GET /api/media/list` — lists S3 objects.
- `DELETE /api/media/delete` — deletes an object from S3.

---

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env.local` file:

```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-central-1
MEDIA_BUCKET=your_bucket_name
```

### 3. IAM permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::your-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket"
    }
  ]
}
```

### 4. S3 CORS configuration

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 5. Run locally

```bash
npm run dev
```

---

## 🔄 Upload flow (Direct-to-Storage)

1. The browser sends **metadata only** to Next.js:

   - `POST /api/upload-url` → `{ fileName, fileType }`
   - `POST /api/multipart/start` / `part-url` / `complete` for large files

2. The API routes use AWS SDK v3 to create S3 commands and generate **presigned URLs**.

3. The browser uploads binary data **directly to S3**:

   - single upload: `PUT {file}` to the presigned `uploadUrl`
   - multipart upload: `PUT {chunk}` to each presigned part URL

4. Next.js never receives or streams file binaries – it only:
   - issues presigned URLs,
   - starts/completes multipart uploads,
   - lists objects,
   - deletes objects.

---

## 🧩 API Summary

- `POST /api/upload-url` — presigned PUT URL for normal uploads  
- `POST /api/multipart/start` — start multipart upload  
- `POST /api/multipart/part-url` — get presigned URL for chunk  
- `POST /api/multipart/complete` — finalize multipart upload  
- `GET /api/media/list` — list bucket contents  
- `DELETE /api/media/delete` — delete object  

---

## 🏗 Architecture & Security

### Why Presigned PUT URLs?

- Simpler from the client side  
- Compatible with multipart uploads  
- Allows progress tracking  
- Keeps server out of data pipeline  

### Security model

- Bucket remains private  
- IAM user restricted to single-bucket minimal scope  
- Presigned URLs are short-lived and object-scoped  
- No file binary ever touches the server  

