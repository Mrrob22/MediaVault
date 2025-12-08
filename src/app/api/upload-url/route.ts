import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

        const ext = body.fileName.split(".").pop();
        const safeName = body.fileName.replace(/[^\w.\-]/g, "_");
        const key = `${Date.now()}-${safeName}`;

        const command = new PutObjectCommand({
            Bucket: MEDIA_BUCKET,
            Key: key,
            ContentType: body.fileType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 60 * 5,
        });

        return NextResponse.json({ uploadUrl, key });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to create upload URL" },
            { status: 500 }
        );
    }
}
