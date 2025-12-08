import { NextRequest, NextResponse } from "next/server";
import {
    CreateMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { MEDIA_BUCKET } from "@/lib/config";

export const runtime = "nodejs";

interface Body {
    fileName: string;
    fileType: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;

        if (!body.fileName || !body.fileType) {
            return NextResponse.json(
                { error: "fileName and fileType are required" },
                { status: 400 }
            );
        }

        const safeName = body.fileName.replace(/[^\w.\-]/g, "_");
        const key = `${Date.now()}-${safeName}`;

        const command = new CreateMultipartUploadCommand({
            Bucket: MEDIA_BUCKET,
            Key: key,
            ContentType: body.fileType,
        });

        const res = await s3Client.send(command);

        if (!res.UploadId) {
            return NextResponse.json(
                { error: "No uploadId returned from S3" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            uploadId: res.UploadId,
            key,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to start multipart upload" },
            { status: 500 }
        );
    }
}
