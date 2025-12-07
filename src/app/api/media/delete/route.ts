import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { MEDIA_BUCKET } from "@/lib/config";

export const runtime = "nodejs";

interface Body {
    key: string;
}

export async function DELETE(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;
        if (!body.key) {
            return NextResponse.json({ error: "key is required" }, { status: 400 });
        }

        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: MEDIA_BUCKET,
                Key: body.key,
            })
        );

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to delete object" },
            { status: 500 }
        );
    }
}
