// src/plugins/cookie.ts
import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import { Env } from '@/config/env';

const cookiePlugin = fp(async (fastify) => {
  fastify.register(cookie, {
    secret: Env.COOKIE_SECRET,
  });
});

export { cookiePlugin };
