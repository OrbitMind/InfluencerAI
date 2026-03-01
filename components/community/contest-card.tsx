'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Clock, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ContestData } from '@/lib/types/community'

interface ContestCardProps {
  contest: ContestData
  onClick?: (contest: ContestData) => void
}

export function ContestCard({ contest, onClick }: ContestCardProps) {
  const timeLeft = formatDistanceToNow(new Date(contest.endsAt), { addSuffix: true, locale: ptBR })
  const isEnded = new Date(contest.endsAt) < new Date()
  const entryCount = contest._count?.entries ?? 0

  return (
    <Card
      className="hover:shadow-md hover:border-amber-500/50 transition-all cursor-pointer"
      onClick={() => onClick?.(contest)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Trophy className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <Badge variant={isEnded ? 'secondary' : 'default'} className="text-xs">
            {isEnded ? 'Encerrado' : 'Ativo'}
          </Badge>
        </div>
        <CardTitle className="text-sm leading-tight">{contest.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{contest.description}</p>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {isEnded ? 'Encerrado' : `Termina ${timeLeft}`}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {entryCount} participantes
          </div>
        </div>
        <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            🏆 Prêmio: {contest.prize}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
