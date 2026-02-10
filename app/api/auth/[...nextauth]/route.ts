import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth/config"

/**
 * NextAuth.js API Route Handler
 * Centraliza todas as rotas de autenticação:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback/:provider
 * - /api/auth/session
 * - etc.
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
