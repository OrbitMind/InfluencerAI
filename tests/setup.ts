import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock do Prisma Client
vi.mock('@/lib/db', () => ({
  prisma: {
    // User
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Persona
    persona: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    personaAsset: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Campaign
    campaign: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    campaignTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    // Generation (History)
    generation: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // Billing
    creditBalance: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    creditTransaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    subscriptionPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    // API Keys
    apiKey: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Social (Sprint 7)
    socialAccount: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    scheduledPost: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    // Transaction helper
    $transaction: vi.fn((callback) => {
      if (typeof callback === 'function') {
        return callback({
          creditBalance: {
            findUnique: vi.fn(),
            update: vi.fn(),
            upsert: vi.fn(),
          },
          creditTransaction: {
            create: vi.fn(),
          },
        })
      }
      return Promise.resolve(callback)
    }),
  },
}))

// Mock do NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

// Mock do Storage Service
vi.mock('@/lib/services/storage/cloudinary-storage.service', () => ({
  CloudinaryStorageService: vi.fn(() => ({
    upload: vi.fn(() =>
      Promise.resolve({
        url: 'https://mock.cloudinary.com/image.png',
        publicId: 'mock-public-id',
        fileSize: 102400,
        width: 1024,
        height: 1024,
      })
    ),
    delete: vi.fn(() => Promise.resolve()),
    getUrl: vi.fn((publicId) => `https://mock.cloudinary.com/${publicId}`),
  })),
}))

// Mock do Encryption Service
vi.mock('@/lib/services/encryption/aes-encryption.service', () => ({
  getEncryptionService: vi.fn(() => ({
    encrypt: vi.fn((plaintext) => ({
      encrypted: Buffer.from(plaintext).toString('base64'),
      iv: 'mock-iv',
      authTag: 'mock-auth-tag',
    })),
    decrypt: vi.fn((data) => Buffer.from(data.encrypted, 'base64').toString('utf-8')),
  })),
}))

// Mock fetch global
global.fetch = vi.fn()

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
