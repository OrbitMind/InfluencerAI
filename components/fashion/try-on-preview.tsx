'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Share2 } from 'lucide-react'
import type { TryOnResult } from '@/lib/types/fashion'

interface TryOnPreviewProps {
  originalPersonaUrl: string
  result: TryOnResult
}

export function TryOnPreview({ originalPersonaUrl, result }: TryOnPreviewProps) {
  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = result.outputUrl
    a.download = `try-on-${result.generationId}.png`
    a.click()
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Original</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image src={originalPersonaUrl} alt="Original" fill className="object-cover" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-primary">Resultado Try-On</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image src={result.outputUrl} alt="Try-on result" fill className="object-cover" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
