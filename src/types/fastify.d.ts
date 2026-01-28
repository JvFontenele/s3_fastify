import { PrismaClient } from '@prisma/client';
import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      id: number;
      person: {
        id: number;
        name: string;
        email: string;
        cpfCnpj: string;
      };
    };
    user: {
      sub: string;
      id: number;
      person: {
        id: number;
        name: string;
        email: string;
        cpfCnpj: string;
      };
    };
  }
}
