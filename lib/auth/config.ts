import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import EmailProvider from "next-auth/providers/email"
import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { UserRepository } from "@/lib/repositories/user.repository"
import { CreditService } from "@/lib/services/billing/credit.service"

const resend = new Resend(process.env.RESEND_API_KEY);

const userRepository = new UserRepository();

/**
 * Configuração do NextAuth.js
 *
 * Providers implementados:
 * 1. Credentials (email/senha)
 * 2. Google OAuth
 * 3. GitHub OAuth
 * 4. Magic Link (email sem senha)
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    // 1. Credenciais (email/senha)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios")
        }

        // Verificar se usuário existe e senha está correta
        const isValid = await userRepository.verifyPassword(
          credentials.email,
          credentials.password
        );

        if (!isValid) {
          throw new Error("Credenciais inválidas")
        }

        // Buscar usuário completo
        const user = await userRepository.findByEmail(credentials.email);

        if (!user) {
          throw new Error("Usuário não encontrado")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        }
      }
    }),

    // 2. Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    // 3. GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!
    }),

    // 4. Magic Link (Email via Resend)
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject: "Login - InfluencerAI",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
              <h2 style="text-align: center;">InfluencerAI</h2>
              <p>Clique no botão abaixo para fazer login:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${url}" style="background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Entrar no InfluencerAI
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">Se você não solicitou este email, ignore-o.</p>
              <p style="color: #666; font-size: 12px;">Este link expira em 24 horas.</p>
            </div>
          `
        });
      }
    })
  ],

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    verifyRequest: "/verify-email"
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },

  events: {
    async createUser({ user }) {
      // Inicializar créditos gratuitos para novos usuários OAuth
      try {
        const creditService = new CreditService();
        await creditService.initializeCredits(user.id);
      } catch (error) {
        console.error('Error initializing credits for OAuth user:', error);
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development'
}
