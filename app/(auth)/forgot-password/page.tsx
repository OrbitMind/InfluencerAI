"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (data.success) {
        setSent(true)
        toast.success("Email enviado!")
      } else {
        toast.error(data.error || "Erro ao enviar email")
      }
    } catch {
      toast.error("Erro ao processar solicitação")
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-16">
        <div className="text-center space-y-4">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Verifique seu email</h1>
          <p className="text-muted-foreground">
            Se o email <strong>{email}</strong> estiver cadastrado,
            você receberá um link para redefinir sua senha.
          </p>
          <p className="text-sm text-muted-foreground">
            O link expira em 1 hora.
          </p>
          <Link href="/login">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Esqueceu sua senha?</h1>
        <p className="text-muted-foreground mt-2">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar link de recuperação"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Lembrou a senha?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
