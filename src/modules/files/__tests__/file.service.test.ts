import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FileService } from '../file.service.js'

const storageMocks = vi.hoisted(() => ({
  upload: vi.fn(),
  uploadStream: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../storage/storage.service', () => ({
  StorageService: class {
    upload = storageMocks.upload
    uploadStream = storageMocks.uploadStream
    delete = storageMocks.delete
  },
}))

describe('FileService', () => {
  const prisma = {
    person: { findUnique: vi.fn() },
    folder: { findFirst: vi.fn() },
    file: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  } as any

  beforeEach(() => {
    prisma.person.findUnique.mockReset()
    prisma.folder.findFirst.mockReset()
    prisma.file.create.mockReset()
    prisma.file.findUnique.mockReset()
    prisma.file.delete.mockReset()
    prisma.file.findMany.mockReset()
    prisma.file.count.mockReset()
    storageMocks.upload.mockReset()
    storageMocks.uploadStream.mockReset()
    storageMocks.delete.mockReset()
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

  it('uploads file and persists metadata', async () => {
    prisma.person.findUnique.mockResolvedValue({ id: 1 })
    prisma.folder.findFirst.mockResolvedValue({ id: 2, path: 'docs', allowedTypes: [] })
    storageMocks.upload.mockResolvedValue({ url: '/bucket/key' })
    prisma.file.create.mockResolvedValue({ id: 10 })

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
    expect(result).toEqual({ id: 10 })
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
    prisma.file.create.mockResolvedValue({ id: 11 })

    const service = new FileService(prisma)
    const result = await service.upload({
      personId: 1,
      originalName: 'foto.jpg',
      buffer: Buffer.from('x'),
      mimeType: 'image/jpeg',
      size: 10,
      folderId: 2,
    })

    expect(result).toEqual({ id: 11 })
    expect(storageMocks.upload).toHaveBeenCalled()
  })

  it('deletes file and its storage object', async () => {
    prisma.person.findUnique.mockResolvedValue({ id: 1 })
    prisma.file.findUnique.mockResolvedValue({ id: 5, key: '1/file.txt' })
    prisma.file.delete.mockResolvedValue({})

    const service = new FileService(prisma)
    await service.delete(5, 1)

    expect(storageMocks.delete).toHaveBeenCalledWith('1/file.txt')
    expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: 5 } })
  })
})
