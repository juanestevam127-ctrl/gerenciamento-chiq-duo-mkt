import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || '', // e.g. https://<ACCOUNT_ID>.r2.cloudflarestorage.com
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true, // Required for Cloudflare R2 CORS to work perfectly
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { filename, contentType } = body;

        if (!filename || !contentType) {
            return NextResponse.json({ error: 'Filename and contentType are required' }, { status: 400 });
        }

        const bucketName = process.env.CF_R2_BUCKET || 'chiquinho';
        
        // Remove spaces and special chars, append timestamp to ensure unique filename
        const sanitizedName = filename.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "_");
        const uniqueFilename = `${Date.now()}_${sanitizedName}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: uniqueFilename,
            ContentType: contentType,
        });

        // The URL will be valid for 15 minutes (900 seconds)
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
        
        // Construct the final public URL that will be saved in the database
        const publicUrlBase = process.env.CF_R2_PUBLIC_URL || 'https://pub-2c6fb0edb8334604bb426e2845e387a8.r2.dev';
        const finalUrl = `${publicUrlBase.replace(/\/$/, '')}/${uniqueFilename}`;

        return NextResponse.json({ presignedUrl, finalUrl });
    } catch (error: any) {
        console.error('Error generating presigned URL:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL', details: error.message }, { status: 500 });
    }
}
