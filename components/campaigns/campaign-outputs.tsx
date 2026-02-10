"use client"

import { useState } from "react"
import { Download, Image, Video, Music, Layers, Subtitles, FileText, Mic, Share2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VoicePlayer } from "@/components/voice/voice-player"
import { CaptionPreview } from "./caption-preview"
import { PublishModal } from "@/components/social/publish-modal"
import type { CampaignData } from "@/lib/types/campaign"
import type { CaptionSegment, CaptionStyle } from "@/lib/types/caption"

interface CampaignOutputsProps {
  campaign: CampaignData
}

export function CampaignOutputs({ campaign }: CampaignOutputsProps) {
  const [publishModal, setPublishModal] = useState<{
    open: boolean
    mediaUrl: string
    mediaType: "image" | "video"
  }>({ open: false, mediaUrl: "", mediaType: "image" })

  const openPublishModal = (mediaUrl: string, mediaType: "image" | "video") => {
    setPublishModal({ open: true, mediaUrl, mediaType })
  }

  const hasAny = campaign.imageUrl || campaign.videoUrl || campaign.audioUrl || campaign.composedImageUrl || campaign.composedVideoUrl || campaign.srtUrl || campaign.lipSyncVideoUrl

  if (!hasAny) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Layers className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center">
            Nenhum conteúdo gerado ainda. Execute a campanha para gerar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {campaign.imageUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Image className="h-4 w-4" />
              Imagem Gerada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={campaign.imageUrl}
              alt="Imagem da campanha"
              className="w-full rounded-md object-cover"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={campaign.imageUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => openPublishModal(campaign.imageUrl!, "image")}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.composedImageUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Imagem Composta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={campaign.composedImageUrl}
              alt="Imagem composta"
              className="w-full rounded-md object-cover"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={campaign.composedImageUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => openPublishModal(campaign.composedImageUrl!, "image")}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.videoUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Video className="h-4 w-4" />
              Vídeo Gerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src={campaign.videoUrl}
              controls
              className="w-full rounded-md"
              poster={campaign.videoThumbnailUrl || undefined}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={campaign.videoUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
              </a>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => openPublishModal(campaign.videoUrl!, "video")}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
          </CardContent>
        </Card>
      )}

      {campaign.audioUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Music className="h-4 w-4" />
              Narração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VoicePlayer src={campaign.audioUrl} label="Narração da campanha" />
            <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
              <a href={campaign.audioUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {campaign.lipSyncVideoUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Vídeo Lip Sync
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">Beta</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src={campaign.lipSyncVideoUrl}
              controls
              className="w-full rounded-md"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={campaign.lipSyncVideoUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => openPublishModal(campaign.lipSyncVideoUrl!, "video")}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.composedVideoUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Subtitles className="h-4 w-4" />
              Vídeo com Legendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src={campaign.composedVideoUrl}
              controls
              className="w-full rounded-md"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={campaign.composedVideoUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => openPublishModal(campaign.composedVideoUrl!, "video")}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.srtUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Arquivo de Legendas
              <Badge variant="secondary" className="ml-auto text-xs">SRT</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaign.subtitleData && (
              <CaptionPreview
                presetId={campaign.captionPresetId}
                style={(campaign.captionCustomStyle as Partial<CaptionStyle>) || undefined}
                segments={(campaign.subtitleData as { segments: CaptionSegment[] }).segments}
                imageUrl={campaign.imageUrl}
              />
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={campaign.srtUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download SRT
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Publish Modal */}
      <PublishModal
        open={publishModal.open}
        onOpenChange={(open) => setPublishModal({ ...publishModal, open })}
        mediaUrl={publishModal.mediaUrl}
        mediaType={publishModal.mediaType}
        campaignId={campaign.id}
      />
    </div>
  )
}
