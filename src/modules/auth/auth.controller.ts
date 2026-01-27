import { LoginAuthBody } from './auth.schema';
import { BaseController } from '@/shared/BaseController';
import { AuthService } from './auth.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '@/shared/errors/http-error';

export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  login = async (request: FastifyRequest<{ Body: LoginAuthBody }>, reply: FastifyReply) => {
    const { accessToken, refreshToken, user } = await this.authService.login(request.body, reply);

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 60 * 60 * 24 * 7,
    });

    return this.ok(reply, {
      accessToken,
      refreshToken,
      user,
    });
  };

  refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.refreshToken;

    if (!token) {
      throw new UnauthorizedError('Refresh token missing');
    }

    const { accessToken, user } = await this.authService.refreshToken(token, reply);

    return this.ok(reply, { accessToken, user });
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.refreshToken;

    if (!token) {
      throw new UnauthorizedError('Refresh token missing');
    }

    await this.authService.logout(token, reply);

    reply.clearCookie('refreshToken', {
      path: '/auth/refresh',
    });

    this.noContent(reply);
  };
}
