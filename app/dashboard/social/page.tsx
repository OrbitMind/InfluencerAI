"use client"

import { Suspense, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SocialAccountCard } from "@/components/social/social-account-card"
import { ScheduledPostCard } from "@/components/social/scheduled-post-card"
import { Instagram, Music2, Youtube, Plus, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import type { SocialAccount, ScheduledPost } from "@prisma/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, status: "active" },
  { id: "tiktok", name: "TikTok", icon: Music2, status: "stub" },
  { id: "youtube", name: "YouTube", icon: Youtube, status: "stub" },
]

export default function SocialPage() {
  return (
    <Suspense>
      <SocialPageContent />
    </Suspense>
  )
}

function SocialPageContent() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Handle OAuth callback success/error
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    const platform = searchParams.get("platform")

    if (success === "connected" && platform) {
      toast.success(`${platform} conectado com sucesso!`)
    } else if (error) {
      toast.error(`Erro ao conectar: ${error}`)
    }
  }, [searchParams])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [accountsRes, postsRes] = await Promise.all([
        fetch("/api/social/accounts"),
        fetch("/api/social/scheduled?limit=10"),
      ])

      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setAccounts(data.data || [])
      }

      if (postsRes.ok) {
        const data = await postsRes.json()
        setScheduledPosts(data.data || [])
      }
    } catch (error) {
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = (platform: string) => {
    const platformConfig = PLATFORMS.find((p) => p.id === platform)
    if (platformConfig?.status === "stub") {
      toast.info(`${platformConfig.name} em breve! Por enquanto, baixe e poste manualmente.`)
      return
    }

    window.location.href = `/api/social/auth/${platform}`
  }

  const handleDisconnect = async (accountId: string) => {
    try {
      const res = await fetch(`/api/social/accounts/${accountId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Conta desconectada")
        await loadData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao desconectar")
      }
    } catch (error) {
      toast.error("Erro ao desconectar conta")
    }
  }

  const handleCancelPost = async (postId: string) => {
    try {
      const res = await fetch(`/api/social/scheduled/${postId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Post cancelado")
        await loadData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao cancelar")
      }
    } catch (error) {
      toast.error("Erro ao cancelar post")
    }
  }

  const connectedPlatforms = new Set(accounts.map((a) => a.platform))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Publicar</h1>
        <p className="text-muted-foreground">
          Conecte suas redes sociais e agende publicações
        </p>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Conectadas</CardTitle>
          <CardDescription>
            Conecte suas contas de redes sociais para publicar diretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma conta conectada. Conecte uma conta abaixo para começar.
              </AlertDescription>
            </Alert>
          )}

          {accounts.map((account) => (
            <SocialAccountCard
              key={account.id}
              account={account}
              onDisconnect={handleDisconnect}
            />
          ))}

          {/* Connect Platform Buttons */}
          <div className="grid gap-3 md:grid-cols-3 pt-4">
            {PLATFORMS.map((platform) => {
              const PlatformIcon = platform.icon
              const isConnected = connectedPlatforms.has(platform.id)
              const isStub = platform.status === "stub"

              return (
                <Button
                  key={platform.id}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => handleConnect(platform.id)}
                  disabled={isConnected}
                >
                  <PlatformIcon className="h-6 w-6" />
                  <span>
                    {isConnected ? "Conectado" : isStub ? "Em breve" : "Conectar"}
                  </span>
                  <span className="text-xs text-muted-foreground">{platform.name}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Posts</CardTitle>
          <CardDescription>Posts agendados para publicação</CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum post agendado</p>
              <p className="text-sm mt-2">
                Vá para uma campanha e clique em "Publicar" para agendar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledPosts.map((post) => (
                <ScheduledPostCard
                  key={post.id}
                  post={post}
                  onCancel={handleCancelPost}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
