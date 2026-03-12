import { Readable } from 'node:stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FileService } from '../file.service.js'

const storageMocks = vi.hoisted(() => ({
  upload: vi.fn(),
  uploadStream: vi.fn(),
  delete: vi.fn(),
  getStream: vi.fn(),
}))

vi.mock('../../storage/storage.service', () => ({
  StorageService: class {
    upload = storageMocks.upload
    uploadStream = storageMocks.uploadStream
    delete = storageMocks.delete
    getStream = storageMocks.getStream
  },
}))

describe('FileService', () => {
  const prisma = {
    person: { findUnique: vi.fn() },
    folder: { findFirst: vi.fn() },
    user: { findFirst: vi.fn() },
    fileShare: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    file: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  } as any

  beforeEach(() => {
    prisma.person.findUnique.mockReset()
    prisma.folder.findFirst.mockReset()
    prisma.user.findFirst.mockReset()
    prisma.fileShare.upsert.mockReset()
    prisma.fileShare.deleteMany.mockReset()
    prisma.fileShare.findMany.mockReset()
    prisma.file.create.mockReset()
    prisma.file.update.mockReset()
    prisma.file.findUnique.mockReset()
    prisma.file.delete.mockReset()
    prisma.file.findMany.mockReset()
    prisma.file.count.mockReset()
    storageMocks.upload.mockReset()
    storageMocks.uploadStream.mockReset()
    storageMocks.delete.mockReset()
    storageMocks.getStream.mockReset()
  })

  it('throws when person does not exist', async () => {
    prisma.person.findUnique.mockResolvedValue(null)

    const service = new FileService(prisma)

    await expect(
      service.upload({
        personId: 1,
        originalName: 'doc.txt',
        buffer: Buffer.from('x'),
        mimeType: 'text/plain',
        size: 1,
        folderId: undefined,
      }),
    ).rejects.toThrow('Pessoa não encontrada.')
  })

  it('uploads file and returns secure access url', async () => {
    prisma.person.findUnique.mockResolvedValue({ id: 1 })
    prisma.folder.findFirst.mockResolvedValue({ id: 2, path: 'docs', allowedTypes: [] })
    storageMocks.upload.mockResolvedValue({ url: '/bucket/key' })
    prisma.file.create.mockResolvedValue({ id: 10, accessKey: 'acc-10' })

    const service = new FileService(prisma)
    const result = await service.upload({
      personId: 1,
      originalName: 'Meu Arquivo.pdf',
      buffer: Buffer.from('x'),
      mimeType: 'application/pdf',
      size: 10,
      folderId: 2,
    })

    expect(storageMocks.upload).toHaveBeenCalledWith(
      expect.stringContaining('1/docs/'),
      expect.any(Buffer),
      'application/pdf',
    )
    expect(prisma.file.create).toHaveBeenCalled()
    expect(result).toMatchObject({
      id: 10,
      fileUrl: '/files/access/acc-10',
    })
  })

  it('rejects upload when folder has restricted types and file is not allowed', async () => {
    prisma.person.findUnique.mockResolvedValue({ id: 1 })
    prisma.folder.findFirst.mockResolvedValue({ id: 2, path: 'docs', allowedTypes: ['pdf'] })

    const service = new FileService(prisma)

    await expect(
      service.upload({
        personId: 1,
        originalName: 'foto.jpg',
        buffer: Buffer.from('x'),
        mimeType: 'image/jpeg',
        size: 10,
        folderId: 2,
      }),
    ).rejects.toThrow('Tipo de arquivo não permitido nesta pasta.')
  })

  it('accepts upload when mime type is allowed by folder', async () => {
    prisma.person.findUnique.mockResolvedValue({ id: 1 })
    prisma.folder.findFirst.mockResolvedValue({
      id: 2,
      path: 'docs',
      allowedTypes: ['image/jpeg'],
    })
    storageMocks.upload.mockResolvedValue({ url: '/bucket/key' })
    prisma.file.create.mockResolvedValue({ id: 11, accessKey: 'acc-11' })

    const service = new FileService(prisma)
    const result = await service.upload({
      personId: 1,
      originalName: 'foto.jpg',
      buffer: Buffer.from('x'),
      mimeType: 'image/jpeg',
      size: 10,
      folderId: 2,
    })

    expect(result).toMatchObject({ id: 11, fileUrl: '/files/access/acc-11' })
    expect(storageMocks.upload).toHaveBeenCalled()
  })

  it('deletes file and its storage object when owner matches', async () => {
    prisma.file.findUnique.mockResolvedValue({ id: 5, key: '1/file.txt', personId: 1 })
    prisma.file.delete.mockResolvedValue({})

    const service = new FileService(prisma)
    await service.delete(5, 1)

    expect(storageMocks.delete).toHaveBeenCalledWith('1/file.txt')
    expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: 5 } })
  })

  it('blocks deleting file from another owner', async () => {
    prisma.file.findUnique.mockResolvedValue({ id: 5, key: '1/file.txt', personId: 2 })
    const service = new FileService(prisma)

    await expect(service.delete(5, 1)).rejects.toThrow('Você não tem permissão para excluir este arquivo.')
  })

  it('lists only root files when folderId is not provided', async () => {
    prisma.file.findMany.mockResolvedValue([{ id: 1, accessKey: 'a1' }])
    prisma.file.count.mockResolvedValue(1)

    const service = new FileService(prisma)
    const result = await service.findFilesByPersonId(1, { skip: 0, take: 10 })

    expect(prisma.file.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { personId: 1, folderId: null },
      }),
    )
    expect(prisma.file.count).toHaveBeenCalledWith({
      where: { personId: 1, folderId: null },
    })
    expect(result.data[0]).toMatchObject({
      id: 1,
      fileUrl: '/files/access/a1',
    })
  })

  it('resolves accessible file for shared user and streams content', async () => {
    prisma.file.findUnique.mockResolvedValue({
      id: 7,
      key: '1/private.txt',
      fileName: 'private.txt',
      mimeType: 'text/plain',
      personId: 1,
      isPublic: false,
      shares: [{ personId: 2 }],
    })
    storageMocks.getStream.mockResolvedValue(Readable.from('ok'))

    const service = new FileService(prisma)
    const result = await service.getFileContentByAccessKey('abc', 2)

    expect(result.fileName).toBe('private.txt')
    expect(result.mimeType).toBe('text/plain')
    expect(storageMocks.getStream).toHaveBeenCalledWith('1/private.txt')
  })

  it('prevents anonymous access when file is private', async () => {
    prisma.file.findUnique.mockResolvedValue({
      id: 8,
      key: '1/private.txt',
      fileName: 'private.txt',
      mimeType: 'text/plain',
      personId: 1,
      isPublic: false,
      shares: [],
    })

    const service = new FileService(prisma)

    await expect(service.getFileContentByAccessKey('abc')).rejects.toThrow(
      'Você não tem permissão para acessar este arquivo.',
    )
  })
})
