// src/core/BaseController.ts
import type { FastifyReply, FastifyRequest } from 'fastify';

export abstract class BaseController {
  protected ok(reply: FastifyReply, data: unknown) {
    return reply.status(200).send(data);
  }

  protected created(reply: FastifyReply, data: unknown) {
    return reply.status(201).send(data);
  }

  protected noContent(reply: FastifyReply) {
    return reply.status(204).send();
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

  protected getPagination(request: FastifyRequest) {
    const query = request.query as {
      page?: string | number;
      limit?: string | number;
    };

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

    return {
      page,
      limit,
      skip: (page - 1) * limit,
      take: limit,
    };
  }
}
