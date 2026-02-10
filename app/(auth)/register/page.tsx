import { Metadata } from "next"
import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Criar conta - InfluencerAI",
  description: "Crie sua conta e comece a gerar conteúdo incrível"
}

export default function RegisterPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Criar sua conta</h1>
        <p className="text-muted-foreground mt-2">
          Junte-se a milhares de criadores de conteúdo
        </p>
      </div>

      <div className="space-y-6">
        <SocialAuthButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou crie com email
            </span>
          </div>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-primary font-medium"
          >
            Fazer login
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com nossos{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Termos de Serviço
          </Link>{" "}
          e{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  )
}
