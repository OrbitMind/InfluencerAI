import { Sparkles } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="font-semibold text-lg">InfluencerAI</span>
    </Link>
  )
}
