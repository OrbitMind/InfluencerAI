'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MoodboardAiSummaryProps {
  personaId: string
  currentSummary: string | null
  onSummaryGenerated: (summary: string) => void
}

export function MoodboardAiSummary({ personaId, currentSummary, onSummaryGenerated }: MoodboardAiSummaryProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateSummary = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/personas/${personaId}/moodboard/ai-summary`, { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onSummaryGenerated(data.data.summary)
      toast.success('Resumo visual gerado! O basePrompt da persona foi atualizado.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar resumo')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Resumo Visual com IA
        </CardTitle>
        <CardDescription className="text-xs">
          A IA analisa as imagens do moodboard e atualiza o basePrompt da persona automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentSummary && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
            {currentSummary}
          </p>
        )}
        <Button
          onClick={generateSummary}
          disabled={isGenerating}
          size="sm"
          className="w-full cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando imagens...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {currentSummary ? 'Regenerar Resumo' : 'Gerar Resumo Visual'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
