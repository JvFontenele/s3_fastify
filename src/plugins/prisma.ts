import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

const prismaPlugin = fp(async (fastify: FastifyInstance) => {
  // Conecta no start
  await prisma.$connect()

  // Disponibiliza no fastify
  fastify.decorate('prisma', prisma)

  // Fecha conexão ao desligar o servidor
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
})

export { prismaPlugin }