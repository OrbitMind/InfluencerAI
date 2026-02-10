"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TemplateSelector } from "./template-selector"
import { CampaignVariableForm } from "./campaign-variable-form"
import { CaptionStyleSelector } from "./caption-style-selector"
import { CaptionPreview } from "./caption-preview"
import { LipSyncToggle } from "./lip-sync-toggle"
import { useCampaign } from "@/lib/context/campaign-context"
import { usePersona } from "@/lib/context/persona-context"
import type { CampaignTemplateData, TemplateVariable } from "@/lib/types/campaign"
import type { CaptionStyle, SegmentationMode } from "@/lib/types/caption"
import type { LipSyncModel } from "@/lib/types/lip-sync"
import type { PersonaData } from "@/lib/types/persona"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STEPS = [
  { title: "Template", description: "Escolha o tipo de campanha" },
  { title: "Persona", description: "Selecione o influenciador" },
  { title: "Detalhes", description: "Nome e descrição" },
  { title: "Variáveis", description: "Configure o conteúdo" },
  { title: "Legendas", description: "Estilo de legendas (opcional)" },
]

interface CampaignWizardProps {
  initialPersonaId?: string
  initialTemplateId?: string
}

export function CampaignWizard({ initialPersonaId, initialTemplateId }: CampaignWizardProps) {
  const router = useRouter()
  const { createCampaign } = useCampaign()
  const { personas, fetchPersonas } = usePersona()

  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplateData | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [captionPresetId, setCaptionPresetId] = useState<string | null>(null)
  const [captionCustomStyle, setCaptionCustomStyle] = useState<Partial<CaptionStyle> | null>(null)
  const [captionSegmentationMode, setCaptionSegmentationMode] = useState<SegmentationMode>("timed")
  const [useLipSync, setUseLipSync] = useState(false)
  const [lipSyncModel, setLipSyncModel] = useState<LipSyncModel>("sadtalker")

  // Load personas if not already loaded
  useEffect(() => {
    if (personas.length === 0) {
      fetchPersonas()
    }
  }, [personas.length, fetchPersonas])

  const templateVars = (selectedTemplate?.variables ?? []) as TemplateVariable[]

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0: return !!selectedTemplate
      case 1: return !!selectedPersona
      case 2: return name.trim().length >= 2
      case 3: {
        const required = templateVars.filter((v) => v.required)
        return required.every((v) => variables[v.name]?.trim())
      }
      case 4: return true // Legendas are optional
      default: return false
    }
  }, [step, selectedTemplate, selectedPersona, name, templateVars, variables])

  const handleNext = () => {
    if (step < STEPS.length - 1 && canAdvance()) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!selectedTemplate || !selectedPersona) return

    setIsSubmitting(true)
    try {
      const campaign = await createCampaign({
        name: name.trim(),
        description: description.trim() || undefined,
        personaId: selectedPersona.id,
        templateId: selectedTemplate.id,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
        captionPresetId: captionPresetId || undefined,
        captionCustomStyle: captionCustomStyle || undefined,
        captionSegmentationMode: captionSegmentationMode || undefined,
        useLipSync: useLipSync || undefined,
        lipSyncModel: useLipSync ? lipSyncModel : undefined,
      })
      toast.success("Campanha criada com sucesso!")
      router.push(`/dashboard/campaigns/${campaign.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar campanha")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTemplateSelect = (template: CampaignTemplateData) => {
    setSelectedTemplate(template)
    // Pre-fill default values from template variables
    const defaults: Record<string, string> = {}
    const vars = (template.variables ?? []) as TemplateVariable[]
    for (const v of vars) {
      if (v.defaultValue) defaults[v.name] = v.defaultValue
    }
    setVariables(defaults)
    // Auto-generate name
    if (!name) setName(`${template.name} - Nova Campanha`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, index) => (
          <div key={s.title} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                index < step
                  ? "bg-primary text-primary-foreground"
                  : index === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index < step ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  index < step ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 0: Template Selection */}
          {step === 0 && (
            <TemplateSelector
              selectedId={selectedTemplate?.id ?? initialTemplateId ?? null}
              onSelect={handleTemplateSelect}
            />
          )}

          {/* Step 1: Persona Selection */}
          {step === 1 && (
            <div className="space-y-3">
              {personas.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma persona encontrada. Crie uma persona primeiro.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {personas.map((persona) => (
                    <Card
                      key={persona.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedPersona?.id === persona.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedPersona(persona)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        {persona.referenceImageUrl ? (
                          <img
                            src={persona.referenceImageUrl}
                            alt={persona.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                            {persona.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{persona.name}</p>
                          {persona.niche && (
                            <p className="text-xs text-muted-foreground">{persona.niche}</p>
                          )}
                        </div>
                        {selectedPersona?.id === persona.id && (
                          <Check className="h-4 w-4 text-primary ml-auto shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Campaign Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Nome da Campanha *</Label>
                <Input
                  id="campaign-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Review iPhone 16 - Janeiro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-description">Descrição</Label>
                <Textarea
                  id="campaign-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o objetivo da campanha"
                  rows={3}
                />
              </div>
              <LipSyncToggle
                enabled={useLipSync}
                model={lipSyncModel}
                personaHasImage={!!selectedPersona?.referenceImageUrl}
                personaHasVoice={!!selectedPersona?.voiceId}
                onToggle={setUseLipSync}
                onModelChange={setLipSyncModel}
              />
            </div>
          )}

          {/* Step 3: Variables */}
          {step === 3 && (
            <CampaignVariableForm
              variables={templateVars}
              values={variables}
              onChange={setVariables}
            />
          )}

          {/* Step 4: Captions */}
          {step === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CaptionStyleSelector
                presetId={captionPresetId}
                customStyle={captionCustomStyle}
                segmentationMode={captionSegmentationMode}
                onPresetChange={setCaptionPresetId}
                onCustomStyleChange={setCaptionCustomStyle}
                onSegmentationModeChange={setCaptionSegmentationMode}
              />
              <div className="flex items-center justify-center">
                <CaptionPreview
                  presetId={captionPresetId}
                  style={captionCustomStyle || undefined}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canAdvance()}>
            Avançar
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canAdvance() || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Campanha
          </Button>
        )}
      </div>
    </div>
  )
}
