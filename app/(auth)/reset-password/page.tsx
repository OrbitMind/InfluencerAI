"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Link inválido</h1>
        <p className="text-muted-foreground mt-2">
          Este link de recuperação é inválido ou expirou.
        </p>
        <Link href="/forgot-password">
          <Button className="mt-4">Solicitar novo link</Button>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        toast.success("Senha redefinida com sucesso!")
      } else {
        toast.error(data.error || "Erro ao redefinir senha")
      }
    } catch {
      toast.error("Erro ao processar solicitação")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h1 className="text-2xl font-bold">Senha redefinida!</h1>
        <p className="text-muted-foreground">
          Sua senha foi alterada com sucesso. Agora você pode fazer login.
        </p>
        <Link href="/login">
          <Button className="mt-4">Ir para o login</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Nova senha</h1>
        <p className="text-muted-foreground mt-2">
          Digite sua nova senha abaixo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Redefinindo..." : "Redefinir senha"}
        </Button>
      </form>
    </div>
  )
}
