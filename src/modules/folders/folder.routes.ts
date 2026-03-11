import type { FastifyInstance } from 'fastify';
import { authHook } from '@/hooks/auth';
import { FolderService } from './folder.service.js';
import { FolderController } from './folder.controller.js';
import {
  CreateFolderBodySchema,
  FolderListQuerySchema,
  FolderResponseSchema,
  GetFolderParamsSchema,
  UpdateFolderBodySchema,
} from './folder.schema.js';
import { PaginatedResponseSchema } from '@/schemas/pagination.schema';

const tag = 'Folder';

export default async function folderRoutes(app: FastifyInstance) {
  const service = new FolderService(app.prisma);
  const controller = new FolderController(service);

  app.addHook('preHandler', authHook);

  app.post(
    '/',
    {
      schema: {
        summary: 'Create a folder',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        body: CreateFolderBodySchema,
        response: { 201: FolderResponseSchema },
      },
    },
    controller.create,
  );

  app.get(
    '/',
    {
      schema: {
        summary: 'List folders by parent',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        querystring: FolderListQuerySchema,
        response: { 200: PaginatedResponseSchema(FolderResponseSchema.array()) },
      },
    },
    controller.list,
  );

  app.get(
    '/:id',
    {
      schema: {
        summary: 'Get folder by id',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetFolderParamsSchema,
        response: { 200: FolderResponseSchema },
      },
    },
    controller.getById,
  );

  app.delete(
    '/:id',
    {
      schema: {
        summary: 'Delete a folder',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetFolderParamsSchema,
        response: {},
      },
    },
    controller.delete,
  );

  app.patch(
    '/:id',
    {
      schema: {
        summary: 'Update folder name or allowed types',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetFolderParamsSchema,
        body: UpdateFolderBodySchema,
        response: { 200: FolderResponseSchema },
      },
    },
    controller.update,
  );
}
