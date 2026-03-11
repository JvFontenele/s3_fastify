// src/modules/person/person.routes.ts
import type { FastifyInstance } from 'fastify';
import { PersonController } from './person.controller.js';
import { PersonService } from './person.service.js';
import { CreatePersonBodySchema, PersonResponseSchema } from './person.schema.js';

const tag = 'Person';

export default async function personRoutes(app: FastifyInstance) {
  const service = new PersonService(app.prisma);
  const controller = new PersonController(service);

  app.post(
    '/public',
    {
      schema: {
        summary: 'Public Create a new person',
        tags: [tag],
        body: CreatePersonBodySchema,
        response: { 201: PersonResponseSchema, 200: PersonResponseSchema },
      },
    },
    controller.postPersonPublic,
  );
}
