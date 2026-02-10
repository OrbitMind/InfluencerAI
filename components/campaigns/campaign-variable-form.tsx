"use client"

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
import type { TemplateVariable } from "@/lib/types/campaign"

interface CampaignVariableFormProps {
  variables: TemplateVariable[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  disabled?: boolean
}

export function CampaignVariableForm({
  variables,
  values,
  onChange,
  disabled,
}: CampaignVariableFormProps) {
  const handleChange = (name: string, value: string) => {
    onChange({ ...values, [name]: value })
  }

  if (variables.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Este template não possui variáveis configuráveis.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {variables.map((variable) => (
        <div key={variable.name} className="space-y-2">
          <Label htmlFor={variable.name}>
            {variable.label}
            {variable.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {variable.type === "text" && (
            <Input
              id={variable.name}
              value={values[variable.name] || variable.defaultValue || ""}
              onChange={(e) => handleChange(variable.name, e.target.value)}
              placeholder={variable.placeholder}
              disabled={disabled}
            />
          )}

          {variable.type === "textarea" && (
            <Textarea
              id={variable.name}
              value={values[variable.name] || variable.defaultValue || ""}
              onChange={(e) => handleChange(variable.name, e.target.value)}
              placeholder={variable.placeholder}
              rows={3}
              disabled={disabled}
            />
          )}

          {variable.type === "select" && variable.options && (
            <Select
              value={values[variable.name] || variable.defaultValue || ""}
              onValueChange={(v) => handleChange(variable.name, v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={variable.placeholder || "Selecione..."} />
              </SelectTrigger>
              <SelectContent>
                {variable.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  )
}
