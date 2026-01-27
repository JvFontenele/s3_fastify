import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginAuthBodySchema } from './auth.schema';

const tag = 'Auth';

export default async function AuthRoutes(app: FastifyInstance) {
  const authService = new AuthService(app.prisma);
  const authController = new AuthController(authService);

  app.post(
    '/login',
    {
      schema: {
        summary: 'Login',
        tags: [tag],
        security: [],
        body: LoginAuthBodySchema,
      },
    },
    authController.login,
  );
}
