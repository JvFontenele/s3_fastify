import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.decorate(
    'authenticate',
    async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({ message: 'Não autorizado' });
      }
    }
  );
});
