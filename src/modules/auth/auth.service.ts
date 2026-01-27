import { PrismaClient } from '../../../prisma/generated/client';
import { LoginAuthBody } from './auth.schema';
import { verifyHash } from '@/utils/hash';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async login(data: LoginAuthBody) {
    const user = await this.prisma.user.findUnique({
      where: { username: data.email },
      include:{
        person: true
      }
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const passwordMatch = await verifyHash(data.password, user.password);

    if (!passwordMatch) {
      throw new Error('Credenciais inválidas');
    }

    return user;
  }
}
