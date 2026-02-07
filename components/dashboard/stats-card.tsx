"use client"

import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
}

export function StatsCard({ title, value, description, icon: Icon, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
