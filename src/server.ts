import { fastify } from 'fastify';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform, ZodTypeProvider } from 'fastify-type-provider-zod';

import { fastifySwagger } from '@fastify/swagger';
import { fastifyCors } from '@fastify/cors';
import autoload from '@fastify/autoload';
import ScalarApiReference from '@scalar/fastify-api-reference';

import { prismaPlugin } from './plugins/prisma';

import log from 'consola';
import ck from 'chalk';
import { join } from 'node:path';
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
      description: 'API de distribuição de arquivos para o S3',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
});

app.register(prismaPlugin);

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
  configuration:{
    authentication:{
      securitySchemes:{},
    }
  }
});



app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  log.log('');
  log.log('');
  log.success(ck.bold.blue('======================================='));
  log.success(ck.bold.blue('      File Distribution API'));
  log.success(ck.bold.blue('======================================='));
  log.log('');
  log.log('');
  log.success(ck.bold.green('Server running at ' + ck.underline.blue('http://localhost:3333')));
  log.success(ck.bold.green('API docs at' + ck.underline.blue(' http://localhost:3333/docs')));
});
