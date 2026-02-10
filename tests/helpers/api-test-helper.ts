import { NextRequest } from 'next/server'
import { vi } from 'vitest'
import { getServerSession } from 'next-auth'

export function createMockRequest(params: {
  method?: string
  body?: Record<string, unknown>
  query?: Record<string, string>
  headers?: Record<string, string>
  url?: string
}): NextRequest {
  const {
    method = 'GET',
    body,
    query,
    headers = {},
    url = 'http://localhost:3000/api/test',
  } = params

  // Build URL with query params
  const urlObj = new URL(url)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value)
    })
  }

  // Mock NextRequest
  const request = {
    method,
    url: urlObj.toString(),
    nextUrl: urlObj,
    headers: new Headers(headers),
    json: vi.fn(async () => body),
    text: vi.fn(async () => JSON.stringify(body)),
  } as any

  return request as NextRequest
}

export function mockAuthSession(userId: string | null): void {
  const session = userId
    ? {
        user: {
          id: userId,
          email: `user-${userId}@test.com`,
          name: 'Test User',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    : null

  vi.mocked(getServerSession).mockResolvedValue(session as any)
}
