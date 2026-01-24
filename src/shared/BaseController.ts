// src/core/BaseController.ts
import type { FastifyReply, FastifyRequest } from 'fastify';

export abstract class BaseController<Service> {
  protected service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  protected ok(reply: FastifyReply, data: unknown) {
    return reply.status(200).send(data);
  }

  protected created(reply: FastifyReply, data: unknown) {
    return reply.status(201).send(data);
  }

  protected noContent(reply: FastifyReply) {
    return reply.status(204).send();
  }
  protected badRequest(reply: FastifyReply, message: string) {
    reply.status(400).send({ message });
  }

  protected notFound(reply: FastifyReply, message: string) {
    reply.status(404).send({ message });
  }

  protected internalServerError(reply: FastifyReply, message: string) {
    reply.status(500).send({ message });
  }
}
