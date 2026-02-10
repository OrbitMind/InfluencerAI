"use client"

import { Megaphone, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function EmptyCampaignState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="rounded-full bg-muted p-4">
        <Megaphone className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">Nenhuma campanha ainda</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        Crie sua primeira campanha usando um template e uma persona para gerar conteúdo completo.
      </p>
      <Button asChild>
        <Link href="/dashboard/campaigns/new">
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Link>
      </Button>
    </div>
  )
}
