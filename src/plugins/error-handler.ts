import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { Prisma } from '../prisma/client';
import { AppError } from '@/shared/errors/AppError';
import { prismaErrorToHttp } from '@/shared/errors/prisma-error';
import type { FastifyError } from 'fastify';
import consola from 'consola';
import ck from 'chalk';

const errorPlugin = fp(async (app) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    consola.error(ck.red(String(error.code)), error.message);
    consola.error(error);
    request.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.message,
      });
    }

    if (error instanceof ZodError) {
      return reply.status(422).send({
        message: 'Erro de Validação',
        code: 'VALIDATION_ERROR',
        errors: error.issues.map(({ path, message }) => ({
          field: path.length ? path.join('.') : null,
          message,
        })),
      });
    }

    if (error?.code && error.code === 'FST_ERR_VALIDATION' && error.validation) {
      return reply.status(422).send({
        message: 'Erro de Validação',
        code: 'VALIDATION_ERROR',
        errors: error.validation.map((v: any) => ({
          field: v.instancePath
            ? v.instancePath.replace('/', '').replaceAll('/', '.')
            : (v.params?.missingProperty ?? null),
          message: v.message,
        })),
      });
    }
    
    if (error?.code && error.code === 'FST_INVALID_MULTIPART_CONTENT_TYPE') {
      return reply.status(422).send({
        message: 'Tipo de arquivo inválido',
        code: 'VALIDATION_ERROR',
      });
    }

    if (error?.code && error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send({
        message: 'Requisição muito grande',
        code: 'FILE_TOO_LARGE',
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientValidationError) {
      const httpError = prismaErrorToHttp(error);

      return reply.status(httpError.statusCode).send({
        message: httpError.message,
        code: httpError.code,
      });
    }

    return reply.status(500).send({
      message: 'Internal server error',
    });
  });
});

export { errorPlugin };
