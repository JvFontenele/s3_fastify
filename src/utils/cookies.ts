import { CookieSerializeOptions } from '@fastify/cookie';
import { FastifyReply } from 'fastify';

export function setCookie(reply: FastifyReply, name: string, value: string, options: CookieSerializeOptions = {}) {
  const defaultOptions: CookieSerializeOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    ...options,
  };

  reply.setCookie(name, value, defaultOptions);
}
