import { authHook } from '@/hooks/auth';
import { FastifyInstance } from 'fastify';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FileResponseSchema } from './file.schema';

const tag = 'File';

export default async function fileRoutes(app: FastifyInstance) {
  const service = new FileService(app.prisma);
  const controller = new FileController(service);

  app.addHook('preHandler', authHook);
  app.post(
    '/',
    {
      schema: {
        summary: 'Upload a file',
        tags: [tag],
        security: [{ bearerAuth: [] }],
         consumes: ['multipart/form-data'],
        response: { 201: FileResponseSchema },
      },
    },
    controller.upload,
  );
}
