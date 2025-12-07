import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { MEDIA_BUCKET, MEDIA_PUBLIC_BASE_URL } from "@/lib/config";
import type { MediaObject } from "@/types/media";

export const runtime = "nodejs";

export async function GET() {
    try {
        const res = await s3Client.send(
            new ListObjectsV2Command({
                Bucket: MEDIA_BUCKET,
            })
        );

        const contents = res.Contents ?? [];

        const items: MediaObject[] = contents
            .filter((obj) => !!obj.Key)
            .map((obj) => ({
                key: obj.Key!,
                url: `${MEDIA_PUBLIC_BASE_URL}/${encodeURIComponent(obj.Key!)}`,
                size: obj.Size ?? null,
                lastModified: obj.LastModified?.toISOString() ?? null,
            }));

        return NextResponse.json({ items });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to list media" },
            { status: 500 }
        );
    }
}
