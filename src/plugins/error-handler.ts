import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { Prisma } from '../../prisma/generated/client';
import { AppError } from '@/shared/errors/AppError';
import { prismaErrorToHttp } from '@/shared/errors/prisma-error';

export default fp(async (app) => {
  app.setErrorHandler((error, request, reply) => {
    // 🔍 Log sempre
    request.log.error(error);

    /**
     * 🔴 Erros de domínio
     */
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.message,
      });
    }

    /**
     * 🟠 Validação Zod
     */
    if (error instanceof ZodError) {
      return reply.status(422).send({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: error.issues.map(({ path, message }) => ({
          field: path.length ? path.join('.') : null,
          message,
        })),
      });
    }

    /**
     * 🔵 Prisma
     */
    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientValidationError) {
      const httpError = prismaErrorToHttp(error);

      return reply.status(httpError.statusCode).send({
        message: httpError.message,
        code: httpError.code,
      });
    }

    /**
     * 🟣 Fallback
     */
    return reply.status(500).send({
      message: 'Internal server error',
    });
  });
});
