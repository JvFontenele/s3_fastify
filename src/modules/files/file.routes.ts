import { authHook } from '@/hooks/auth';
import { FastifyInstance } from 'fastify';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FileResponseSchema, FileUploadSchema } from './file.schema';

const tag = 'File';

export default async function fileRoutes(app: FastifyInstance) {
  const service = new FileService(app.prisma);
  const controller = new FileController(service);

  app.addHook('preHandler', authHook);
  app.post(
    '/',
    {
      schema: {
        summary: 'Upload de arquivos',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        body: FileUploadSchema,

        response: {
          201: FileResponseSchema,
        },
      },
    },
    controller.upload,
  );
}
