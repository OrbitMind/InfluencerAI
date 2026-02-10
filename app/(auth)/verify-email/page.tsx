import { Metadata } from "next"
import { Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Verifique seu email - InfluencerAI",
  description: "Verifique seu email para continuar"
}

export default function VerifyEmailPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <div className="text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Verifique seu email
          </h1>
          <p className="text-muted-foreground">
            Enviamos um link de autenticação para seu email
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-left space-y-4">
          <h2 className="font-semibold">Próximos passos:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Abra seu cliente de email</li>
            <li>Procure por um email de <strong>InfluencerAI</strong></li>
            <li>Clique no link mágico para fazer login</li>
            <li>Você será redirecionado automaticamente</li>
          </ol>

          <p className="text-xs text-muted-foreground">
            O link expira em 24 horas. Se você não recebeu o email, verifique sua pasta de spam.
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          Já tem o link?{" "}
          <a
            href="/login"
            className="underline underline-offset-4 hover:text-primary font-medium"
          >
            Voltar para login
          </a>
        </div>
      </div>
    </div>
  )
}
