// src/modules/user/user.routes.ts
import type { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserBodySchema, GetUserParamsSchema, UserResponseSchema } from './user.schema';

const tag = 'User';

export default async function userRoutes(app: FastifyInstance) {
  const service = new UserService(app.prisma);
  const controller = new UserController(service);

  app.post(
    '/users',
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
    '/users',
    {
      schema: {
        summary: 'Get all users',
        tags: [tag],
        response: { 200: UserResponseSchema.array() },
      },
    },
    controller.getAllUsers,
  );

  app.get(
    '/users/:id',
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
    '/users/:id',
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
