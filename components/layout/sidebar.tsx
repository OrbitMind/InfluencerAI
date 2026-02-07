"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ImageIcon, VideoIcon, Settings, History } from "lucide-react"

const navigation = [
  { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Gerador de Imagem", href: "/dashboard/image-generator", icon: ImageIcon },
  { name: "Gerador de Vídeo", href: "/dashboard/video-generator", icon: VideoIcon },
  { name: "Histórico", href: "/dashboard/history", icon: History },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16 lg:border-r lg:border-border/40 lg:bg-sidebar">
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
