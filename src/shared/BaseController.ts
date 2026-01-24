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

  protected unauthorized(reply: FastifyReply, message: string) {
    reply.status(401).send({ message });
  }

  protected paginated(reply: FastifyReply, data: unknown[], total: number, page: number, limit: number) {
    return reply.status(200).send({
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  /**
   * Extrai paginação da query (?page=1&limit=10)
   */
  protected getPagination(request: FastifyRequest) {
    const query = request.query as {
      page?: string | number;
      limit?: string | number;
    };

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
      take: limit,
    };
  }

  /**
   * Formata resposta paginada
   */
}
