import type { FastifyRequest, FastifyReply } from 'fastify';
import { StorageService } from './storage.service';
import { randomUUID } from 'crypto';

const storage = new StorageService();

export async function uploadFile(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const file = await request.file();

  if (!file) {
    return reply.status(400).send({ message: 'File is required' });
  }

  const buffer = await file.toBuffer();
  const key = `${randomUUID()}-${file.filename}`;

  const result = await storage.upload(
    key,
    buffer,
    file.mimetype
  );

  return reply.status(201).send(result);
}
