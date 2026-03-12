import { PaginatedResponseSchema, PaginationQuerySchema } from '@/schemas/pagination.schema';
import { authHook, optionalAuthHook } from '@/hooks/auth';
import { FastifyInstance } from 'fastify';
import { FileService } from './file.service.js';
import { FileController } from './file.controller.js';
import {
  FileResponseSchema,
  FileUploadSchema,
  FileListQuerySchema,
  FileShareResponseSchema,
  GetFileByAccessKeyParamsSchema,
  GetFileParamsSchema,
  ShareFileBodySchema,
  UpdateFileVisibilityBodySchema,
} from './file.schema.js';

const tag = 'File';

export default async function fileRoutes(app: FastifyInstance) {
  const service = new FileService(app.prisma);
  const controller = new FileController(service);

  app.get(
    '/access/:accessKey',
    {
      preHandler: optionalAuthHook,
      schema: {
        summary: 'Abrir arquivo por chave de acesso (dono, compartilhado ou público)',
        tags: [tag],
        params: GetFileByAccessKeyParamsSchema,
        response: {},
      },
    },
    controller.accessByKey,
  );

  app.post(
    '/',
    {
      preHandler: authHook,
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

  app.post(
    '/stream',
    {
      preHandler: authHook,
      schema: {
        summary: 'Upload de arquivos com stream',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        body: FileUploadSchema,

        response: {
          201: FileResponseSchema,
        },
      },
    },
    controller.uploadStream,
  );

  app.get(
    '/',
    {
      preHandler: authHook,
      schema: {
        summary: 'Get all files by person',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        querystring: PaginationQuerySchema.merge(FileListQuerySchema),
        response: {
          200: PaginatedResponseSchema(FileResponseSchema.array()),
        },
      },
    },
    controller.findByPerson,
  );

  app.delete(
    '/:id',
    {
      preHandler: authHook,
      schema: {
        summary: 'Delete a file by ID',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetFileParamsSchema,
        response: {},
      },
    },
    controller.delete,
  );

  app.patch(
    '/:id/visibility',
    {
      preHandler: authHook,
      schema: {
        summary: 'Atualizar visibilidade pública de um arquivo',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetFileParamsSchema,
        body: UpdateFileVisibilityBodySchema,
        response: {
          200: FileResponseSchema,
        },
      },
    },
    controller.updateVisibility,
  );

  app.get(
    '/:id/shares',
    {
      preHandler: authHook,
      schema: {
        summary: 'Listar compartilhamentos do arquivo',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetFileParamsSchema,
        response: {
          200: FileShareResponseSchema.array(),
        },
      },
    },
    controller.listShares,
  );

  app.post(
    '/:id/shares',
    {
      preHandler: authHook,
      schema: {
        summary: 'Compartilhar arquivo com usuário por e-mail',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetFileParamsSchema,
        body: ShareFileBodySchema,
        response: {
          201: ShareFileBodySchema,
        },
      },
    },
    controller.shareByEmail,
  );

  app.post(
    '/:id/shares/remove',
    {
      preHandler: authHook,
      schema: {
        summary: 'Remover compartilhamento por e-mail',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetFileParamsSchema,
        body: ShareFileBodySchema,
        response: {},
      },
    },
    controller.unshareByEmail,
  );
}
