import { BaseService } from '@/shared/BaseService';
import { CreateFileInput, CreateFileInputStream } from './file.schema';
import { ConflictError } from '@/shared/errors/http-error';
import { randomUUID } from 'node:crypto';
import { StorageService } from '../storage/storage.service';
import { normalizeFileName, streamWithSize } from '@/utils/file';

export class FileService extends BaseService {
  private storage = new StorageService();

  async upload(data: CreateFileInput) {
    const existPerson = await this.prisma.person.findUnique({ where: { id: data.personId } });
    if (!existPerson) {
      throw new ConflictError('Pessoa não encontrada.');
    }

    const key = `${data.personId}/${randomUUID()}-${normalizeFileName(data.originalName)}`;

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

  async uploadStream(data: CreateFileInputStream) {
    const existPerson = await this.prisma.person.findUnique({ where: { id: data.personId } });
    if (!existPerson) {
      throw new ConflictError('Pessoa não encontrada.');
    }

    const key = `${data.personId}/${randomUUID()}-${normalizeFileName(data.originalName)}`;

    const { stream, getSize } = streamWithSize(data.stream);

    const { url } = await this.storage.uploadStream(key, stream, data.mimeType);

    const file = await this.prisma.file.create({
      data: {
        fileName: data.originalName,
        key,
        fileUrl: url,
        mimeType: data.mimeType,
        size: BigInt(getSize()),
        personId: data.personId,
      },
    });

    return file;
  }

  async delete(id: number, idPessoa: number) {
    const person = await this.prisma.person.findUnique({ where: { id: idPessoa } });

    if (!person) {
      throw new ConflictError('Pessoa não encontrada.');
    }

    const file = await this.prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new ConflictError('Arquivo não encontrado.');
    }

    await this.storage.delete(file.key);

    await this.prisma.file.delete({
      where: { id: id },
    });
  }

  async findFilesByPersonId(personId: number, { skip, take }: { skip: number; take: number }) {
    const [data, total] = await Promise.all([
      this.prisma.file.findMany({
        skip,
        take,
        where: { personId },
        orderBy: {
          mimeType: 'desc',
        },
      }),
      this.prisma.file.count({ where: { personId } }),
    ]);

    return { data, total };
  }
}
