import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LoginAuthBodySchema, AuthResponseSchema } from './auth.schema.js';

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
        response: {
          200: AuthResponseSchema,
        },
      },
    },
    authController.login,
  );

  app.post(
    '/refresh',
    {
      schema: {
        summary: 'Refresh Token',
        tags: [tag],
        response: {
          200: AuthResponseSchema,
        },
      },
    },
    authController.refreshToken,
  );

  app.post(
    '/logout',
    {
      schema: {
        summary: 'Logout',
        tags: [tag],
      },
    },
    authController.logout,
  );
}
