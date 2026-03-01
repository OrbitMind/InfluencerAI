import type { Prisma } from '@prisma/client'

/**
 * Converts a plain object to Prisma.InputJsonValue safely.
 * Avoids double-cast `as unknown as Prisma.InputJsonValue` spread throughout the codebase.
 */
export function toJsonValue(obj: Record<string, unknown>): Prisma.InputJsonValue {
  return obj as unknown as Prisma.InputJsonValue
}
