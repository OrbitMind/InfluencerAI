"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Mail } from "lucide-react"

export function MagicLinkForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/dashboard"
      })

      if (result?.error) {
        toast.error("Erro ao enviar link mágico")
        return
      }

      setSent(true)
      toast.success("Link mágico enviado! Verifique seu email.")
    } catch (error) {
      toast.error("Erro ao enviar link mágico")
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Verifique seu email</h3>
          <p className="text-sm text-muted-foreground">
            Enviamos um link mágico para <strong>{email}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Clique no link para fazer login sem senha
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setSent(false)}
          className="w-full"
        >
          Enviar novamente
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Enviaremos um link mágico para você fazer login sem senha
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Enviando..." : "Enviar link mágico"}
      </Button>
    </form>
  )
}
