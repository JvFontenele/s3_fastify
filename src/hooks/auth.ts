// src/hooks/auth.ts
import { UnauthorizedError } from '@/shared/errors/http-error';
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  try {
    // const auth = request.headers.authorization;

    // if (!auth) throw new UnauthorizedError('Unauthorized');

    // const token = auth.replace('Bearer ', '');

    
    await request.jwtVerify();
    
  } catch {
    throw new UnauthorizedError('Unauthorized');
  }
}
