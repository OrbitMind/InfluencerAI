"use client"

import { useState, useEffect } from "react"
import { Loader2, Check, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBilling } from "@/lib/context/billing-context"
import { toast } from "sonner"

export function UpgradeModal() {
  const { showUpgrade, setShowUpgrade, plans, fetchPlans, subscription } = useBilling()
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)

  useEffect(() => {
    if (showUpgrade && plans.length === 0) {
      fetchPlans()
    }
  }, [showUpgrade, plans.length, fetchPlans])

  const handleUpgrade = async (planSlug: string) => {
    setLoadingSlug(planSlug)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error || "Erro ao iniciar checkout")
        return
      }

      // Redirect to Stripe checkout
      window.location.href = json.data.url
    } catch {
      toast.error("Erro ao iniciar checkout")
    } finally {
      setLoadingSlug(null)
    }
  }

  const currentPlanSlug = subscription?.plan?.slug || "free"
  const paidPlans = plans.filter((p) => p.slug !== "free")

  return (
    <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Upgrade seu plano
          </DialogTitle>
          <DialogDescription>
            Seus créditos acabaram. Escolha um plano para continuar gerando conteúdo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {paidPlans.map((plan) => {
            const isCurrent = plan.slug === currentPlanSlug
            return (
              <Card
                key={plan.id}
                className={isCurrent ? "ring-2 ring-primary" : ""}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    {plan.name}
                    {isCurrent && <Badge variant="secondary">Atual</Badge>}
                  </CardTitle>
                  <p className="text-2xl font-bold">
                    R$ {(plan.priceMonthly / 100).toFixed(2).replace(".", ",")}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium text-primary">
                    {plan.creditsMonthly} créditos/mês
                  </p>
                  <ul className="space-y-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Check className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isCurrent || !plan.stripePriceId || loadingSlug !== null}
                    onClick={() => handleUpgrade(plan.slug)}
                  >
                    {loadingSlug === plan.slug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      "Plano atual"
                    ) : (
                      "Assinar"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
