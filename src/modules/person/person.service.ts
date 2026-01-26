// src/modules/user/user.service.ts
import { BaseService } from '@/shared/BaseService';
import { CreatePersonBody } from './person.schema';

export class PersonService extends BaseService {
  async findAll({ skip, take }: { skip: number; take: number }) {
    const [data, total] = await Promise.all([this.prisma.person.findMany({ skip, take }), this.prisma.person.count()]);
    return { data, total };
  }

  async create(data: CreatePersonBody) {
    return this.prisma.person.create({ data });
  }

  async findById(id: number) {
    return this.prisma.person.findUnique({ where: { id } });
  }

  async delete(id: number) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) {
      throw new Error('Person not found');
    }
    return this.prisma.person.delete({ where: { id } });
  }
}
