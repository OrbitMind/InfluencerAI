import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SlugService } from '@/lib/services/slug-service'
import { prisma } from '@/lib/db'

describe('SlugService', () => {
  let slugService: SlugService

  beforeEach(() => {
    slugService = new SlugService()
    vi.clearAllMocks()
  })

  describe('generateSlug', () => {
    it('converte para lowercase', () => {
      const result = slugService.generateSlug('HELLO WORLD')
      expect(result).toBe('hello-world')
    })

    it('substitui espaços por hifens', () => {
      const result = slugService.generateSlug('hello world test')
      expect(result).toBe('hello-world-test')
    })

    it('remove acentos', () => {
      const result = slugService.generateSlug('José André Ação')
      expect(result).toBe('jose-andre-acao')
    })

    it('remove caracteres especiais', () => {
      const result = slugService.generateSlug('hello@world#test!')
      expect(result).toBe('hello-world-test')
    })

    it('lida com múltiplos espaços consecutivos', () => {
      const result = slugService.generateSlug('hello    world')
      expect(result).toBe('hello-world')
    })

    it('remove hifens do início e fim', () => {
      const result = slugService.generateSlug('  hello world  ')
      expect(result).toBe('hello-world')
    })

    it('lida com string vazia', () => {
      const result = slugService.generateSlug('')
      expect(result).toBe('')
    })

    it('lida com apenas espaços', () => {
      const result = slugService.generateSlug('   ')
      expect(result).toBe('')
    })

    it('preserva números', () => {
      const result = slugService.generateSlug('Test 123')
      expect(result).toBe('test-123')
    })
  })

  describe('generateUniqueSlug', () => {
    it('retorna slug base se não existe', async () => {
      vi.mocked(prisma.persona.findFirst).mockResolvedValue(null)

      const result = await slugService.generateUniqueSlug('test-slug', 'persona')

      expect(result).toBe('test-slug')
      expect(prisma.persona.findFirst).toHaveBeenCalledWith({
        where: { slug: 'test-slug' },
      })
    })

    it('adiciona -2 se slug já existe', async () => {
      vi.mocked(prisma.persona.findFirst)
        .mockResolvedValueOnce({ slug: 'test-slug' } as any)
        .mockResolvedValueOnce(null)

      const result = await slugService.generateUniqueSlug('test-slug', 'persona')

      expect(result).toBe('test-slug-2')
    })

    it('incrementa até encontrar único', async () => {
      vi.mocked(prisma.persona.findFirst)
        .mockResolvedValueOnce({ slug: 'test-slug' } as any)
        .mockResolvedValueOnce({ slug: 'test-slug-2' } as any)
        .mockResolvedValueOnce({ slug: 'test-slug-3' } as any)
        .mockResolvedValueOnce(null)

      const result = await slugService.generateUniqueSlug('test-slug', 'persona')

      expect(result).toBe('test-slug-4')
      expect(prisma.persona.findFirst).toHaveBeenCalledTimes(4)
    })

    it('funciona para model campaignTemplate', async () => {
      vi.mocked(prisma.campaignTemplate.findFirst).mockResolvedValue(null)

      const result = await slugService.generateUniqueSlug('template-slug', 'campaignTemplate')

      expect(result).toBe('template-slug')
      expect(prisma.campaignTemplate.findFirst).toHaveBeenCalledWith({
        where: { slug: 'template-slug' },
      })
    })
  })
})
