// src/modules/person/person.routes.ts
import type { FastifyInstance } from 'fastify';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';
import { CreatePersonBodySchema, GetPersonParamsSchema, PersonResponseSchema } from './person.schema';
import { PaginationQuerySchema, PaginatedResponseSchema } from '@/schemas/pagination.schema';
import { authHook } from '@/hooks/auth';

const tag = 'Person';

export default async function personRoutes(app: FastifyInstance) {
  const service = new PersonService(app.prisma);
  const controller = new PersonController(service);

  app.addHook('preHandler', authHook);

  app.post(
    '/',
    {
      schema: {
        summary: 'Create a new person',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        body: CreatePersonBodySchema,
        response: { 201: PersonResponseSchema },
      },
    },
    controller.postPerson,
  );

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all persons',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        querystring: PaginationQuerySchema,
        response: { 200: PaginatedResponseSchema(PersonResponseSchema.array()) },
      },
    },
    controller.getAllPersons,
  );

  app.get(
    '/:id',
    {
      schema: {
        summary: 'Get a person by ID',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetPersonParamsSchema,
        response: { 200: PersonResponseSchema },
      },
    },
    controller.getPersonById,
  );

  app.delete(
    '/:id',
    {
      schema: {
        summary: 'Delete a person by ID',
        tags: [tag],
        security: [{ bearerAuth: [] }],
        params: GetPersonParamsSchema,
        response: {},
      },
    },
    controller.deletePerson,
  );
}
