import { S3Client } from '@aws-sdk/client-s3';
import { Env } from './env';

export const s3Client = new S3Client({
  endpoint: Env.S3_ENDPOINT,
  region: Env.S3_REGION,
  credentials: {
    accessKeyId: Env.S3_ACCESS_KEY!,
    secretAccessKey: Env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});
