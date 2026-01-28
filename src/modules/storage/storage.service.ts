import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/config/s3.client';
import { Env } from '@/config/env';
import { Readable } from 'node:stream';
import { Upload } from '@aws-sdk/lib-storage';

export class StorageService {
  private bucket = Env.S3_BUCKET_NAME!;

  async upload(key: string, body: Buffer, contentType: string) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return {
      key,
      url: `${Env.S3_ENDPOINT}/${this.bucket}/${key}`,
    };
  }

  async uploadStream(key: string, stream: Readable, contentType: string) {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
      },
      queueSize: 4, // paralelismo
      partSize: 10 * 1024 * 1024, // 10MB por parte
      leavePartsOnError: false,
    });

    await upload.done();

    return {
      key,
      url: `${Env.S3_ENDPOINT}/${this.bucket}/${key}`,
    };
  }

  async delete(key: string) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async get(key: string) {
    const { Body } = await s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return Body;
  }

  async getStream(key: string): Promise<Readable> {
    const { Body } = await s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return Body as Readable;
  }
}
