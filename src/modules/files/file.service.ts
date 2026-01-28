import { BaseService } from '@/shared/BaseService';
import { CreateFileInput } from './file.schema';
import { ConflictError } from '@/shared/errors/http-error';
import { randomUUID } from 'node:crypto';
import { StorageService } from '../storage/storage.service';

export class FileService extends BaseService {
  private storage = new StorageService();
  async upload(data: CreateFileInput) {
    const existPerson = await this.prisma.person.findUnique({ where: { id: data.personId } });
    if (!existPerson) {
      throw new ConflictError('Person with this email already exists');
    }

    const key = `${data.personId}/${randomUUID()}-${data.originalName}`;

    const { url } = await this.storage.upload(key, data.buffer, data.mimeType);

    const file = await this.prisma.file.create({
      data: {
        fileName: data.originalName,
        key,
        fileUrl: url,
        mimeType: data.mimeType,
        size: data.size,
        personId: data.personId,
      },
    });

    return file;
  }

  async delete(id: number) {
    const file = await this.prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new ConflictError('File not found');
    }

    await this.storage.delete(file.key);

    await this.prisma.file.delete({
      where: { id: id },
    });
  }

  async findFilesByPersonId(personId: number, { skip, take }: { skip: number; take: number }) {
    const [data, total] = await Promise.all([
      this.prisma.file.findMany({ skip, take, where: { personId } }),
      this.prisma.file.count({ where: { personId } }),
    ]);

    return { data, total };
  }
}
