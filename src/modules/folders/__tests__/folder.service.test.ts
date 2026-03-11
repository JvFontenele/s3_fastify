import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FolderService } from '../folder.service.js'

describe('FolderService', () => {
  const prisma = {
    person: { findUnique: vi.fn() },
    folder: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    file: { count: vi.fn() },
  } as any

  beforeEach(() => {
    prisma.person.findUnique.mockReset()
    prisma.folder.findFirst.mockReset()
    prisma.folder.create.mockReset()
    prisma.folder.findMany.mockReset()
    prisma.folder.count.mockReset()
    prisma.folder.delete.mockReset()
    prisma.file.count.mockReset()
  })

  it('throws when person does not exist', async () => {
    prisma.person.findUnique.mockResolvedValue(null)

    const service = new FolderService(prisma)

    await expect(
      service.createFolder({ personId: 1, name: 'Docs', parentId: null }),
    ).rejects.toThrow('Pessoa não encontrada.')
  })

  it('creates folder with parent path', async () => {
    prisma.person.findUnique.mockResolvedValue({ id: 1 })
    prisma.folder.findFirst.mockResolvedValueOnce({ id: 2, path: 'root' })
    prisma.folder.findFirst.mockResolvedValueOnce(null)
    prisma.folder.create.mockResolvedValue({ id: 10 })

    const service = new FolderService(prisma)
    const result = await service.createFolder({ personId: 1, name: 'Docs', parentId: 2 })

    expect(prisma.folder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ path: 'root/Docs' }),
      }),
    )
    expect(result).toEqual({ id: 10 })
  })

  it('prevents deleting non-empty folder', async () => {
    prisma.folder.findFirst.mockResolvedValue({ id: 1 })
    prisma.folder.count.mockResolvedValue(1)
    prisma.file.count.mockResolvedValue(0)

    const service = new FolderService(prisma)

    await expect(service.deleteFolder(1, 1)).rejects.toThrow('A pasta não está vazia.')
  })
})
