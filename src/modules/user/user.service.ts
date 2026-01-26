// src/modules/user/user.service.ts
import { BaseService } from '@/shared/BaseService';
import { CreateUserBody } from './user.schema';

export class UserService extends BaseService {
  async findAll({ skip, take }: { skip: number; take: number }) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        include: {
          person: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return { data, total };
  }

  async create(data: CreateUserBody) {
    return this.prisma.user.create({ data });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async delete(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    return this.prisma.user.delete({ where: { id } });
  }
}
