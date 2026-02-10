import NextAuth from "next-auth"

/**
 * Extensão dos tipos do NextAuth
 * Adiciona 'id' ao objeto User e Session
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}
