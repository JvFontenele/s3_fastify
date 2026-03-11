import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from '../auth.service'
import { UnauthorizedError } from '@/shared/errors/http-error'

const verifyHashMock = vi.hoisted(() => vi.fn())

vi.mock('@/utils/hash', () => ({
  verifyHash: (...args: unknown[]) => verifyHashMock(...args),
}))

vi.mock('@/config/env', () => ({
  Env: {
    EXPIRE_TOKEN_TIME: '1h',
  },
}))

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  } as any

  const reply = {
    jwtSign: vi.fn(),
  } as any

  beforeEach(() => {
    prisma.user.findUnique.mockReset()
    prisma.refreshToken.create.mockReset()
    prisma.refreshToken.updateMany.mockReset()
    prisma.refreshToken.findUnique.mockReset()
    reply.jwtSign.mockReset()
    verifyHashMock.mockReset()
  })

  it('throws when user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const service = new AuthService(prisma)

    await expect(service.login({ email: 'a', password: 'b' }, reply)).rejects.toThrow(
      'Credenciais inválidas',
    )
  })

  it('throws when password is invalid', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      username: 'user',
      password: 'hashed',
      person: { id: 2, email: null },
    })
    verifyHashMock.mockResolvedValue(false)

    const service = new AuthService(prisma)

    await expect(service.login({ email: 'a', password: 'b' }, reply)).rejects.toThrow(
      'Credenciais inválidas',
    )
  })

  it('returns access/refresh tokens on success', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      username: 'user',
      password: 'hashed',
      person: { id: 2, email: null },
    })
    verifyHashMock.mockResolvedValue(true)
    prisma.refreshToken.create.mockResolvedValue({})
    reply.jwtSign.mockResolvedValue('token')

    const service = new AuthService(prisma)
    const result = await service.login({ email: 'a', password: 'b' }, reply)

    expect(result.accessToken).toBe('token')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(result.user.id).toBe(1)
  })

  it('refreshToken throws on invalid or expired token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null)

    const service = new AuthService(prisma)

    await expect(service.refreshToken('bad', reply)).rejects.toBeInstanceOf(UnauthorizedError)
  })
})
