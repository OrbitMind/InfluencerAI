"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode } from "react"

/**
 * Client Component wrapper para NextAuth SessionProvider
 *
 * NextAuth requer um componente cliente para gerenciar a sessão.
 * Este wrapper permite usar SessionProvider no root layout (Server Component)
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
}
