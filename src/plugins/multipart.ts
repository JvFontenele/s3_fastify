import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';

const multipartPlugin = fp(async (app) => {
  app.register(multipart, {
    limits: {
        fileSize: 10 * 1024 * 1024 * 1024,  // 10GB
    },
  });
});

export { multipartPlugin };
