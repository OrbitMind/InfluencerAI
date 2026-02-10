"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CAMPAIGN_STATUSES } from "@/lib/types/campaign"

interface CampaignFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  disabled?: boolean
}

export function CampaignFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  disabled,
}: CampaignFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar campanhas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>
      <Select value={status} onValueChange={onStatusChange} disabled={disabled}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {CAMPAIGN_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
