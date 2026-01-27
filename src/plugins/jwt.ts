import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { Env } from '@/config/env';


const jwtPlugin = fp(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: Env.JWT_SECRET,
  });
});

export {jwtPlugin }
