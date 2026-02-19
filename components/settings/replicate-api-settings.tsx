"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useReplicate } from "@/lib/context/replicate-context"
import { ApiKeyManager } from "./api-key-manager"

/**
 * Componente para configuração da API Replicate
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: gerenciar APENAS configurações da API Replicate
 */
export function ReplicateApiSettings() {
  const { saveApiKey, clearApiKey, isConfigured } = useReplicate()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da API Replicate</CardTitle>
        <CardDescription>Conecte ao Replicate para habilitar a geração de imagens e vídeos</CardDescription>
      </CardHeader>
      <CardContent>
        <ApiKeyManager
          label="Chave de API Replicate"
          placeholder="r8_xxxxxxxxxxxx"
          helpText="Obtenha sua chave de API em"
          helpLink="https://replicate.com/account/api-tokens"
          isConfigured={isConfigured}
          onSave={saveApiKey}
          onClear={clearApiKey}
        />
      </CardContent>
    </Card>
  )
}
