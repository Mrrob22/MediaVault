import { NextRequest, NextResponse } from "next/server";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";
import { MEDIA_BUCKET } from "@/lib/config";

export const runtime = "nodejs";

interface Body {
    key: string;
    uploadId: string;
    partNumber: number;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;

        if (!body.key || !body.uploadId || !body.partNumber) {
            return NextResponse.json(
                { error: "key, uploadId and partNumber are required" },
                { status: 400 }
            );
        }

        const command = new UploadPartCommand({
            Bucket: MEDIA_BUCKET,
            Key: body.key,
            UploadId: body.uploadId,
            PartNumber: body.partNumber,
        });

        const url = await getSignedUrl(s3Client, command, {
            expiresIn: 60 * 5,
        });

        return NextResponse.json({ url });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to create part upload URL" },
            { status: 500 }
        );
    }
}
