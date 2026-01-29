// src/modules/user/user.routes.ts
import type { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserBodySchema, GetUserParamsSchema, UserResponseSchema } from './user.schema';
import { PaginationQuerySchema, PaginatedResponseSchema } from '@/schemas/pagination.schema';
import { authHook } from '@/hooks/auth';

const tag = 'User';

export default async function userRoutes(app: FastifyInstance) {
  const service = new UserService(app.prisma);
  const controller = new UserController(service);


  
  app.post(
    '/',
    {
      schema: {
        summary: 'Create a new user',
        tags: [tag],
        // security: [{ bearerAuth: [] }],
        body: CreateUserBodySchema,
        response: { 201: UserResponseSchema },
      },
    },
    controller.postUser,
  );

  app.addHook('preHandler', authHook);
  
  app.get(
    '/',
    {
      schema: {
        summary: 'Get all users',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        querystring: PaginationQuerySchema,
        response: { 200: PaginatedResponseSchema(UserResponseSchema.array()) },
      },
    },
    controller.getAllUsers,
  );

  app.get(
    '/:id',
    {
      schema: {
        summary: 'Get a user by ID',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetUserParamsSchema,
        response: { 200: UserResponseSchema },
      },
    },
    controller.getUserById,
  );

    app.get(
    '/me',
    {
      schema: {
        summary: 'Get user logged in',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        response: { 200: UserResponseSchema },
      },
    },
    controller.getUserLoggedIn,
  );

  app.delete(
    '/:id',
    {
      schema: {
        summary: 'Delete a user by ID',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetUserParamsSchema,
        response: {},
      },
    },
    controller.deleteUser,
  );
}
