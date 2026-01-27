// src/modules/user/user.service.ts
import { BaseService } from '@/shared/BaseService';
import { CreateUserBody } from './user.schema';
import { ConflictError, NotFoundError } from '@/shared/errors/http-error';
import { hashString } from '@/utils/hash';

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
    const person = await this.prisma.person.findUnique({ where: { id: data.personId } });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    const existeUser = await this.prisma.user.findMany({
      where: { personId: data.personId, status: true },
    });

    if (existeUser.length > 0) {
      throw new ConflictError('User already exists for this person');
    }

    const newPassword = await hashString(data.password);

    return this.prisma.user.create({
      data: {
        username: person?.email!,
        password: newPassword,
        status: true,
        personId: data.personId,
      },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async delete(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.prisma.user.delete({ where: { id } });
  }
}
