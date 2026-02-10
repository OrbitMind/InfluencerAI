export { default } from "next-auth/middleware"

/**
 * Middleware do NextAuth para proteção de rotas
 *
 * Protege automaticamente todas as rotas especificadas em matcher.
 * Usuários não autenticados serão redirecionados para /login
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - api/user/register (registro público)
     * - api/stripe/webhook (webhook do Stripe)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login, register, verify-email (páginas públicas de auth)
     * - / (homepage)
     */
    "/((?!api/auth|api/user/register|api/stripe/webhook|_next/static|_next/image|favicon.ico|login|register|verify-email|^/$).*)",
  ],
}
