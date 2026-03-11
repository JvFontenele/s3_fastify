// src/modules/user/user.routes.ts
import type { FastifyInstance } from 'fastify';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { CreateUserBodySchema, UserResponseSchema } from './user.schema.js';

const tag = 'User';

export default async function userRoutes(app: FastifyInstance) {
  const service = new UserService(app.prisma);
  const controller = new UserController(service);

  app.post(
    '/public',
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
}
