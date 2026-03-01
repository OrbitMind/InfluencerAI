"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CampaignDetailHeader } from "@/components/campaigns/campaign-detail-header"
import { CampaignExecutionPanel } from "@/components/campaigns/campaign-execution-panel"
import { CampaignOutputs } from "@/components/campaigns/campaign-outputs"
import { CampaignExecutionLog } from "@/components/campaigns/campaign-execution-log"
import { useCampaignExecution } from "@/lib/hooks/use-campaign-execution"
import { campaignApiService } from "@/lib/services/CampaignApiService"
import type { CampaignData, ExecutionStep, ExecutionLogEntry, ExecuteCampaignOptions } from "@/lib/types/campaign"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<CampaignData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { isExecuting, execute, duplicate } = useCampaignExecution()

  const loadCampaign = async () => {
    setIsLoading(true)
    const res = await campaignApiService.getCampaign(campaignId)
    if (res.success && res.data) {
      setCampaign(res.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadCampaign()
  }, [campaignId])

  const handleExecute = async (steps: ExecutionStep[], modelOptions?: Omit<ExecuteCampaignOptions, 'steps'>) => {
    const result = await execute(campaignId, { steps, ...modelOptions })
    if (result) {
      setCampaign(result)
      toast.success("Campanha executada com sucesso!")
    } else {
      toast.error("Erro ao executar campanha")
    }
  }

  const handleDuplicate = async () => {
    const result = await duplicate(campaignId)
    if (result) {
      toast.success("Campanha duplicada!")
      router.push(`/dashboard/campaigns/${result.id}`)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await campaignApiService.deleteCampaign(campaignId)
      if (res.success) {
        toast.success("Campanha deletada")
        router.push("/dashboard/campaigns")
      } else {
        toast.error(res.error || "Erro ao deletar")
      }
    } catch {
      toast.error("Erro ao deletar campanha")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Campanha não encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CampaignDetailHeader
        campaign={campaign}
        onDuplicate={handleDuplicate}
        onDelete={() => setShowDeleteDialog(true)}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CampaignOutputs campaign={campaign} />
          <CampaignExecutionLog log={campaign.executionLog as ExecutionLogEntry[] | null} />
        </div>

        <div className="space-y-6">
          <CampaignExecutionPanel
            campaign={campaign}
            isExecuting={isExecuting}
            onExecute={(steps, options) => handleExecute(steps, options)}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Persona</span>
                <Badge variant="outline">{campaign.persona.name}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template</span>
                <Badge variant="secondary">{campaign.template.name}</Badge>
              </div>
              {campaign.startedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Iniciada em</span>
                  <span>{new Date(campaign.startedAt).toLocaleString("pt-BR")}</span>
                </div>
              )}
              {campaign.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concluída em</span>
                  <span>{new Date(campaign.completedAt).toLocaleString("pt-BR")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criada em</span>
                <span>{new Date(campaign.createdAt).toLocaleString("pt-BR")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os conteúdos gerados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
