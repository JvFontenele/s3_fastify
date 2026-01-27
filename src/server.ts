import { fastify } from 'fastify';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform, ZodTypeProvider } from 'fastify-type-provider-zod';

import { fastifySwagger } from '@fastify/swagger';
import { fastifyCors } from '@fastify/cors';
import autoload from '@fastify/autoload';
import ScalarApiReference from '@scalar/fastify-api-reference';

import { prismaPlugin } from './plugins/prisma';
import { jwtPlugin } from './plugins/jwt';

import log from 'consola';
import ck from 'chalk';
import { join } from 'node:path';
import { cookiePlugin } from './plugins/cookie';
import { errorPlugin } from './plugins/error-handler';
// import { userRoutes } from "./modules/user/user.routes";

// import { routes } from "@/routes";

const app = fastify({
  logger: false,
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Api de distribuição de Arquivos',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  transform: jsonSchemaTransform,
});

app.register(prismaPlugin);
app.register(cookiePlugin);
app.register(jwtPlugin);
app.register(errorPlugin);

app.register(autoload, {
  dir: join(__dirname, 'modules'),
  routeParams: true,
});

app.addHook('onRoute', ({ method, path }) => {
  if (method === 'HEAD' || method === 'OPTIONS') return;
  if (path.includes('docs')) return;
  log.success(`[ROUTE] ${ck.green(method)} - ${ck.yellow(path)}`);
});

app.register(ScalarApiReference, {
  routePrefix: '/docs',
  configuration: {
    authentication: {
      preferredSecurityScheme: 'bearerAuth',
    },
    showDeveloperTools: 'never',
  },
});

app
  .listen({ port: 3333, host: '0.0.0.0' })
  .then(() => {
    log.log('');
    log.log('');
    log.success(ck.bold.blue('======================================='));
    log.success(ck.bold.blue('      File Distribution API'));
    log.success(ck.bold.blue('======================================='));
    log.log('');
    log.log('');
    log.success(ck.bold.green('Server running at ' + ck.underline.blue('http://localhost:3333')));
    log.success(ck.bold.green('API docs at' + ck.underline.blue(' http://localhost:3333/docs')));
  })
  .catch((err) => {
    log.error(err);
    process.exit(1);
  });
