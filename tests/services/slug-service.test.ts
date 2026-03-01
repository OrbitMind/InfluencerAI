import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SlugService } from '@/lib/services/slug-service'

describe('SlugService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateSlug', () => {
    it('converte para lowercase', () => {
      expect(SlugService.generateSlug('HELLO WORLD')).toBe('hello-world')
    })

    it('substitui espaços por hifens', () => {
      expect(SlugService.generateSlug('hello world test')).toBe('hello-world-test')
    })

    it('remove acentos', () => {
      expect(SlugService.generateSlug('José André Ação')).toBe('jose-andre-acao')
    })

    it('remove caracteres especiais', () => {
      expect(SlugService.generateSlug('hello@world#test!')).toBe('hello-world-test')
    })

    it('lida com múltiplos espaços consecutivos', () => {
      expect(SlugService.generateSlug('hello    world')).toBe('hello-world')
    })

    it('remove hifens do início e fim', () => {
      expect(SlugService.generateSlug('  hello world  ')).toBe('hello-world')
    })

    it('lida com string vazia', () => {
      expect(SlugService.generateSlug('')).toBe('')
    })

    it('lida com apenas espaços', () => {
      expect(SlugService.generateSlug('   ')).toBe('')
    })

    it('preserva números', () => {
      expect(SlugService.generateSlug('Test 123')).toBe('test-123')
    })
  })

  describe('generateUniqueSlug', () => {
    it('retorna slug base se não existe', async () => {
      const existsCheck = vi.fn().mockResolvedValue(false)

      const result = await SlugService.generateUniqueSlug('test slug', 'user123', existsCheck)

      expect(result).toBe('test-slug')
      expect(existsCheck).toHaveBeenCalledWith('test-slug', 'user123')
    })

    it('adiciona -2 se slug já existe', async () => {
      const existsCheck = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)

      const result = await SlugService.generateUniqueSlug('test slug', 'user123', existsCheck)

      expect(result).toBe('test-slug-2')
    })

    it('incrementa até encontrar único', async () => {
      const existsCheck = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)

      const result = await SlugService.generateUniqueSlug('test slug', 'user123', existsCheck)

      expect(result).toBe('test-slug-4')
      expect(existsCheck).toHaveBeenCalledTimes(4)
    })

    it('passa userId corretamente para existsCheck', async () => {
      const existsCheck = vi.fn().mockResolvedValue(false)

      await SlugService.generateUniqueSlug('minha persona', 'abc-123', existsCheck)

      expect(existsCheck).toHaveBeenCalledWith('minha-persona', 'abc-123')
    })
  })
})
