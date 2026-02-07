import { BaseService } from '@/shared/BaseService';
import { ConflictError } from '@/shared/errors/http-error';
import type { CreateFolderBody } from './folder.schema';

export class FolderService extends BaseService {
  async createFolder(data: CreateFolderBody & { personId: number }) {
    const existPerson = await this.prisma.person.findUnique({ where: { id: data.personId } });
    if (!existPerson) {
      throw new ConflictError('Pessoa não encontrada.');
    }

    const parent = data.parentId
      ? await this.prisma.folder.findFirst({
          where: { id: data.parentId, personId: data.personId },
        })
      : null;

    if (data.parentId && !parent) {
      throw new ConflictError('Pasta pai não encontrada.');
    }

    const existsFolder = await this.prisma.folder.findFirst({
      where: {
        personId: data.personId,
        parentId: data.parentId ?? null,
        name: data.name,
      },
    });

    if (existsFolder) {
      throw new ConflictError('Já existe uma pasta com esse nome.');
    }

    const path = parent ? `${parent.path}/${data.name}` : data.name;

    const folder = await this.prisma.folder.create({
      data: {
        name: data.name,
        path,
        personId: data.personId,
        parentId: data.parentId,
      },
    });

    return folder;
  }

  async listFolders(
    personId: number,
    { skip, take, parentId }: { skip: number; take: number; parentId?: number },
  ) {
    const where = {
      personId,
      parentId: parentId ?? null,
    };

    const [data, total] = await Promise.all([
      this.prisma.folder.findMany({
        skip,
        take,
        where,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.folder.count({ where }),
    ]);

    return { data, total };
  }

  async deleteFolder(id: number, personId: number) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, personId },
    });

    if (!folder) {
      throw new ConflictError('Pasta não encontrada.');
    }

    const [childrenCount, fileCount] = await Promise.all([
      this.prisma.folder.count({ where: { parentId: id } }),
      this.prisma.file.count({ where: { folderId: id } }),
    ]);

    if (childrenCount > 0 || fileCount > 0) {
      throw new ConflictError('A pasta não está vazia.');
    }

    await this.prisma.folder.delete({ where: { id } });
  }
}
