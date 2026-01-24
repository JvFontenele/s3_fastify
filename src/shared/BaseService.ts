import type { PrismaClient } from '../../prisma/generated/client'

export abstract class BaseService {
  protected prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
}