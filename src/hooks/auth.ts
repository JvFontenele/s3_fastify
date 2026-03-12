// src/hooks/auth.ts
import { UnauthorizedError } from '@/shared/errors/http-error';
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function optionalAuthHook(request: FastifyRequest) {
  try {
    await request.jwtVerify();
  } catch {
    // rota pública/compartilhada: sem token continua sem usuário autenticado
  }
}
