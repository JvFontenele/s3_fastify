import { BaseService } from '@/shared/BaseService';
import { CreateFileInput, CreateFileInputStream } from './file.schema.js';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/http-error';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { StorageService } from '../storage/storage.service.js';
import { normalizeFileName, streamWithSize } from '@/utils/file';

export class FileService extends BaseService {
  private storage = new StorageService();
  private readonly accessRoutePrefix = '/files/access';

  private toFileResponse<T extends { accessKey: string }>(file: T) {
    return {
      ...file,
      fileUrl: `${this.accessRoutePrefix}/${file.accessKey}`,
    };
  }

  async upload(data: CreateFileInput) {
    const existPerson = await this.prisma.person.findUnique({ where: { id: data.personId } });
    if (!existPerson) {
      throw new ConflictError('Pessoa não encontrada.');
    }

    const folder = data.folderId
      ? await this.prisma.folder.findFirst({
          where: { id: data.folderId, personId: data.personId },
        })
      : null;

    if (data.folderId && !folder) {
      throw new ConflictError('Pasta não encontrada.');
    }

    if (folder?.allowedTypes?.length) {
      const extension = extname(data.originalName).toLowerCase().replace('.', '');
      const allowed = folder.allowedTypes.map((type) => type.toLowerCase());
      const allowedExts = allowed.filter((type) => !type.includes('/'));
      const allowedMimes = allowed.filter((type) => type.includes('/'));

      const isAllowedByExt = extension && allowedExts.includes(extension);
      const isAllowedByMime = allowedMimes.includes(data.mimeType.toLowerCase());

      if (!isAllowedByExt && !isAllowedByMime) {
        throw new ConflictError('Tipo de arquivo não permitido nesta pasta.');
      }
    }

    const folderPrefix = folder ? `${folder.path}/` : '';
    const key = `${data.personId}/${folderPrefix}${randomUUID()}-${normalizeFileName(data.originalName)}`;

    const { url } = await this.storage.upload(key, data.buffer, data.mimeType);

    const file = await this.prisma.file.create({
      data: {
        fileName: data.originalName,
        key,
        fileUrl: url,
        mimeType: data.mimeType,
        size: data.size,
        personId: data.personId,
        folderId: data.folderId,
      },
    });

    return this.toFileResponse(file);
  }

  async uploadStream(data: CreateFileInputStream) {
    const existPerson = await this.prisma.person.findUnique({ where: { id: data.personId } });
    if (!existPerson) {
      throw new ConflictError('Pessoa não encontrada.');
    }

    const folder = data.folderId
      ? await this.prisma.folder.findFirst({
          where: { id: data.folderId, personId: data.personId },
        })
      : null;

    if (data.folderId && !folder) {
      throw new ConflictError('Pasta não encontrada.');
    }

    if (folder?.allowedTypes?.length) {
      const extension = extname(data.originalName).toLowerCase().replace('.', '');
      const allowed = folder.allowedTypes.map((type) => type.toLowerCase());
      const allowedExts = allowed.filter((type) => !type.includes('/'));
      const allowedMimes = allowed.filter((type) => type.includes('/'));

      const isAllowedByExt = extension && allowedExts.includes(extension);
      const isAllowedByMime = allowedMimes.includes(data.mimeType.toLowerCase());

      if (!isAllowedByExt && !isAllowedByMime) {
        throw new ConflictError('Tipo de arquivo não permitido nesta pasta.');
      }
    }

    const folderPrefix = folder ? `${folder.path}/` : '';
    const key = `${data.personId}/${folderPrefix}${randomUUID()}-${normalizeFileName(data.originalName)}`;

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
        folderId: data.folderId,
      },
    });

    return this.toFileResponse(file);
  }

  async delete(id: number, personId: number) {
    const file = await this.prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new NotFoundError('Arquivo não encontrado.');
    }

    if (file.personId !== personId) {
      throw new ForbiddenError('Você não tem permissão para excluir este arquivo.');
    }

    await this.storage.delete(file.key);

    await this.prisma.file.delete({
      where: { id: id },
    });
  }

  async setFileVisibility(fileId: number, personId: number, isPublic: boolean) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });

    if (!file) {
      throw new NotFoundError('Arquivo não encontrado.');
    }

    if (file.personId !== personId) {
      throw new ForbiddenError('Você não pode alterar a visibilidade deste arquivo.');
    }

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: { isPublic },
    });

    return this.toFileResponse(updated);
  }

  async addShareByEmail(fileId: number, ownerPersonId: number, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });

    if (!file) {
      throw new NotFoundError('Arquivo não encontrado.');
    }

    if (file.personId !== ownerPersonId) {
      throw new ForbiddenError('Você não pode compartilhar este arquivo.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        username: normalizedEmail,
        status: true,
      },
      include: {
        person: true,
      },
    });

    if (!user?.person) {
      throw new NotFoundError('Usuário não encontrado para compartilhamento.');
    }

    if (user.person.id === ownerPersonId) {
      throw new ConflictError('Você já possui acesso a este arquivo.');
    }

    await this.prisma.fileShare.upsert({
      where: {
        fileId_personId: {
          fileId,
          personId: user.person.id,
        },
      },
      update: {},
      create: {
        fileId,
        personId: user.person.id,
      },
    });

    return { email: normalizedEmail };
  }

  async removeShareByEmail(fileId: number, ownerPersonId: number, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });

    if (!file) {
      throw new NotFoundError('Arquivo não encontrado.');
    }

    if (file.personId !== ownerPersonId) {
      throw new ForbiddenError('Você não pode editar compartilhamentos deste arquivo.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        username: normalizedEmail,
      },
      include: { person: true },
    });

    if (!user?.person) {
      return;
    }

    await this.prisma.fileShare.deleteMany({
      where: {
        fileId,
        personId: user.person.id,
      },
    });
  }

  async listShares(fileId: number, ownerPersonId: number) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });

    if (!file) {
      throw new NotFoundError('Arquivo não encontrado.');
    }

    if (file.personId !== ownerPersonId) {
      throw new ForbiddenError('Você não pode visualizar os compartilhamentos deste arquivo.');
    }

    const shares = await this.prisma.fileShare.findMany({
      where: {
        fileId,
      },
      include: {
        person: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares
      .filter((item) => item.person.email)
      .map((item) => ({
        email: item.person.email!,
        createdAt: item.createdAt,
      }));
  }

  async resolveAccessibleFile(accessKey: string, viewerPersonId?: number) {
    const file = await this.prisma.file.findUnique({
      where: { accessKey },
      include: {
        shares: {
          select: { personId: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundError('Arquivo não encontrado.');
    }

    const isOwner = viewerPersonId === file.personId;
    const isShared = viewerPersonId
      ? file.shares.some((share) => share.personId === viewerPersonId)
      : false;

    if (!file.isPublic && !isOwner && !isShared) {
      throw new ForbiddenError('Você não tem permissão para acessar este arquivo.');
    }

    return file;
  }

  async getFileContentByAccessKey(accessKey: string, viewerPersonId?: number) {
    const file = await this.resolveAccessibleFile(accessKey, viewerPersonId);
    const stream = await this.storage.getStream(file.key);

    return {
      stream,
      fileName: file.fileName,
      mimeType: file.mimeType,
    };
  }

  async findFilesByPersonId(
    personId: number,
    { skip, take, folderId }: { skip: number; take: number; folderId?: number },
  ) {
    const where = {
      personId,
      folderId: folderId !== undefined ? folderId : null,
    };

    const [data, total] = await Promise.all([
      this.prisma.file.findMany({
        skip,
        take,
        where,
        orderBy: {
          mimeType: 'desc',
        },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      data: data.map((file) => this.toFileResponse(file)),
      total,
    };
  }
}
