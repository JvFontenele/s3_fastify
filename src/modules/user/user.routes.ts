// src/modules/user/user.routes.ts
import type { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserBodySchema, GetUserParamsSchema, UserResponseSchema } from './user.schema';
import { PaginationQuerySchema, PaginatedResponseSchema } from '@/schemas/pagination.schema';

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
        body: CreateUserBodySchema,
        response: { 201: UserResponseSchema },
      },
    },
    controller.postUser,
  );

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all users',
        tags: [tag],
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
        params: GetUserParamsSchema,
        response: { 200: UserResponseSchema },
      },
    },
    controller.getUserById,
  );

  app.delete(
    '/:id',
    {
      schema: {
        summary: 'Delete a user by ID',
        tags: [tag],
        params: GetUserParamsSchema,
        response: {},
      },
    },
    controller.deleteUser,
  );
}
