import { BaseService } from '@/shared/BaseService';
import { ConflictError } from '@/shared/errors/http-error';
import type { CreateFolderBody, UpdateFolderBody } from './folder.schema.js';

export class FolderService extends BaseService {
  private normalizeAllowedTypes(types?: string[] | null) {
    if (!types) return [];
    return types
      .map((type) => type.trim().toLowerCase())
      .filter(Boolean)
      .map((type) => (type.startsWith('.') ? type.slice(1) : type));
  }

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
        allowedTypes: this.normalizeAllowedTypes(data.allowedTypes),
      },
    });

    return folder;
  }

  async updateFolder(id: number, personId: number, data: UpdateFolderBody) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, personId },
    });

    if (!folder) {
      throw new ConflictError('Pasta não encontrada.');
    }

    const updates: { name?: string; path?: string; allowedTypes?: string[] } = {};

    if (data.name && data.name !== folder.name) {
      const existsFolder = await this.prisma.folder.findFirst({
        where: {
          personId,
          parentId: folder.parentId ?? null,
          name: data.name,
        },
      });

      if (existsFolder) {
        throw new ConflictError('Já existe uma pasta com esse nome.');
      }

      const parent = folder.parentId
        ? await this.prisma.folder.findFirst({
            where: { id: folder.parentId, personId },
          })
        : null;

      const newPath = parent ? `${parent.path}/${data.name}` : data.name;
      const oldPath = folder.path;

      updates.name = data.name;
      updates.path = newPath;

      if (oldPath !== newPath) {
        const children = await this.prisma.folder.findMany({
          where: { personId, path: { startsWith: `${oldPath}/` } },
        });

        await Promise.all(
          children.map((child) =>
            this.prisma.folder.update({
              where: { id: child.id },
              data: {
                path: `${newPath}${child.path.slice(oldPath.length)}`,
              },
            }),
          ),
        );
      }
    }

    if (data.allowedTypes !== undefined) {
      updates.allowedTypes = this.normalizeAllowedTypes(data.allowedTypes);
    }

    if (Object.keys(updates).length === 0) {
      return folder;
    }

    return this.prisma.folder.update({
      where: { id },
      data: updates,
    });
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
