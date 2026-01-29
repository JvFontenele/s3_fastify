import { FastifyReply } from 'fastify';
import { PrismaClient } from '../../prisma/client'
import { LoginAuthBody } from './auth.schema';
import { verifyHash } from '@/utils/hash';
import { randomUUID } from 'crypto';
import { UnauthorizedError } from '@/shared/errors/http-error';
import { Env } from '@/config/env';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async login(data: LoginAuthBody, reply: FastifyReply) {
    const user = await this.prisma.user.findUnique({
      where: { username: data.email },
      include: {
        person: true,
      },
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const accessToken = await reply.jwtSign(
      {
        person: {
          ...user.person,
          email: user.person.email ?? user.username,
        },
        id: user.id,
        sub: user.id.toString(),
      },
      {
        sign: {
          sub: user.id.toString(),
          expiresIn: Env.EXPIRE_TOKEN_TIME,
        },
      },
    );

    const refreshToken = randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    const passwordMatch = await verifyHash(data.password, user.password);

    if (!passwordMatch) {
      throw new Error('Credenciais inválidas');
    }

    return { accessToken, refreshToken, user };
  }

  async refreshToken(token: string, reply: FastifyReply) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { person: true },
      omit: {
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError();
    }

    const accessToken = await reply.jwtSign(
      {
        person: {
          ...user.person,
          email: user.person.email ?? user.username,
        },
        id: user.id,
        sub: user.id.toString(),
      },
      {
        sign: {
          sub: user.id.toString(),
          expiresIn: Env.EXPIRE_TOKEN_TIME,
        },
      },
    );

    return { accessToken, user };
  }

  async logout(token: string, reply: FastifyReply) {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });

    return;
  }
}
