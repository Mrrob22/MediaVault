import { NextRequest, NextResponse } from "next/server";
import {
    CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { MEDIA_BUCKET } from "@/lib/config";

export const runtime = "nodejs";

interface Part {
    ETag: string;
    PartNumber: number;
}

interface Body {
    key: string;
    uploadId: string;
    parts: Part[];
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;

        if (!body.key || !body.uploadId || !body.parts?.length) {
            return NextResponse.json(
                { error: "key, uploadId and parts are required" },
                { status: 400 }
            );
        }

        const command = new CompleteMultipartUploadCommand({
            Bucket: MEDIA_BUCKET,
            Key: body.key,
            UploadId: body.uploadId,
            MultipartUpload: {
                Parts: body.parts.map((p) => ({
                    ETag: p.ETag,
                    PartNumber: p.PartNumber,
                })),
            },
        });

        await s3Client.send(command);

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to complete multipart upload" },
            { status: 500 }
        );
    }
}
