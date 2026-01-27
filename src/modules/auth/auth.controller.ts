import { LoginAuthBody } from './auth.schema';
import { BaseController } from '@/shared/BaseController';
import { AuthService } from './auth.service';
import { FastifyReply, FastifyRequest } from 'fastify';

export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  login = async (request: FastifyRequest<{ Body: LoginAuthBody }>, reply: FastifyReply) => {
    const user = await this.authService.login(request.body);
    const token = await reply.jwtSign({
      sub: user.id,
      person: user.person,
    });

    return this.ok(reply, {
      token,
    });
  };
}
