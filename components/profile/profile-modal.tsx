"use client"

import { useEffect, useState } from "react"
import { CalendarDays, CheckCircle2, Loader2, Mail, Pencil, User, XCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useProfile } from "./use-profile"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return "U"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { profile, loading, saving, error, fetchProfile, updateProfile } = useProfile()

  const [name, setName] = useState("")

  // Load profile when modal opens
  useEffect(() => {
    if (open) fetchProfile()
  }, [open, fetchProfile])

  // Sync form when profile loads
  useEffect(() => {
    if (profile) setName(profile.name ?? "")
  }, [profile])

  const isDirty = profile ? name !== (profile.name ?? "") : false

  async function handleSave() {
    const ok = await updateProfile({ name: name.trim() })
    if (ok) onOpenChange(false)
  }

  function handleClose() {
    if (!saving) onOpenChange(false)
  }

  const initials = getInitials(profile?.name, profile?.email)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
          <DialogDescription>
            Visualize e edite suas informações de conta.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.image ?? undefined} alt={profile?.name ?? "Usuário"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <Separator />

            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                Nome
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                disabled={saving}
              />
            </div>

            {/* Email (somente leitura) */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                E-mail
              </Label>
              <div className="flex items-center gap-2">
                <Input value={profile?.email ?? ""} readOnly disabled className="bg-muted/50" />
                {profile?.emailVerified ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" aria-label="E-mail verificado" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="E-mail não verificado" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.emailVerified ? "E-mail verificado" : "E-mail não verificado"}
              </p>
            </div>

            {/* Membro desde */}
            {profile?.createdAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>Membro desde {formatDate(profile.createdAt)}</span>
              </div>
            )}

            {/* Erro */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
