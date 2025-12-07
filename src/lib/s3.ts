import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION!;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;

if (!region || !accessKeyId || !secretAccessKey) {
    console.warn(
        "[s3] Missing AWS credentials or region. Check your environment variables."
    );
}

export const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});
