"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, ImageIcon, VideoIcon, Settings, History,
  Megaphone, CreditCard, Share2, Video, Shirt, Package, Clapperboard, Users2,
} from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
      { name: "Personas", href: "/dashboard/personas", icon: Users },
      { name: "Campanhas", href: "/dashboard/campaigns", icon: Megaphone },
    ],
  },
  {
    label: 'Criação',
    items: [
      { name: "Gerador de Imagem", href: "/dashboard/image-generator", icon: ImageIcon },
      { name: "Gerador de Vídeo", href: "/dashboard/video-generator", icon: VideoIcon },
      { name: "UGC Factory", href: "/dashboard/ugc", icon: Video },
      { name: "Fashion Factory", href: "/dashboard/fashion", icon: Shirt },
      { name: "Product Placement", href: "/dashboard/product-placement", icon: Package },
      { name: "Motion & Animação", href: "/dashboard/motion", icon: Clapperboard },
    ],
  },
  {
    label: 'Publicar & Comunidade',
    items: [
      { name: "Publicar", href: "/dashboard/social", icon: Share2 },
      { name: "Histórico", href: "/dashboard/history", icon: History },
      { name: "Comunidade", href: "/dashboard/community", icon: Users2 },
    ],
  },
  {
    label: 'Conta',
    items: [
      { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
      { name: "Configurações", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16 lg:border-r lg:border-border/40 lg:bg-sidebar">
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
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
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
