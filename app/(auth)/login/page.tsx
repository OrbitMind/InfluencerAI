import { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { MagicLinkForm } from "@/components/auth/magic-link-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Login - InfluencerAI",
  description: "Entre na sua conta para continuar criando conteúdo incrível"
}

export default function LoginPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta!</h1>
        <p className="text-muted-foreground mt-2">
          Entre na sua conta para continuar criando
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
              Ou continue com
            </span>
          </div>
        </div>

        <Tabs defaultValue="credentials" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credentials">Email e senha</TabsTrigger>
            <TabsTrigger value="magic">Link mágico</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials">
            <LoginForm />
          </TabsContent>

          <TabsContent value="magic">
            <MagicLinkForm />
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link
            href="/register"
            className="underline underline-offset-4 hover:text-primary font-medium"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
