export const MEDIA_BUCKET = process.env.AWS_S3_MEDIA_BUCKET!;
export const MEDIA_REGION = process.env.AWS_REGION!;
export const MEDIA_PUBLIC_BASE_URL =
    process.env.AWS_S3_PUBLIC_BASE_URL || `https://${MEDIA_BUCKET}.s3.${MEDIA_REGION}.amazonaws.com`;
