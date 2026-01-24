import fp from 'fastify-plugin';
import { prismaErrorToHttp } from '@/utils/errors/prisma-error';

export default fp(async app => {
  app.setErrorHandler((error, request, reply) => {
    // Log completo (dev / prod)
    request.log.error(error);

    const httpError = prismaErrorToHttp(error);

    reply.status(httpError.statusCode).send({
      message: httpError.message,
      code: httpError.code,
    });
  });
});
