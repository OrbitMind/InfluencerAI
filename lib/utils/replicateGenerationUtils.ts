import { NextResponse } from "next/server"
import Replicate from "replicate"
import { z, type ZodSchema } from "zod"

/**
 * Factory genérico para rotas de geração Replicate
 * Princípio: DRY (Don't Repeat Yourself) + Template Method Pattern
 * Responsabilidade: eliminar duplicação entre rotas generate-image e generate-video
 */

interface GenerationConfig<T> {
  schema: ZodSchema<T>
  buildInput: (validated: T) => Record<string, unknown>
}

/**
 * Função genérica para processar requisições de geração
 */
export async function handleReplicateGeneration<T extends { apiKey: string; modelId: string }>(
  request: Request,
  config: GenerationConfig<T>
) {
  try {
    const body = await request.json()
    const validated = config.schema.parse(body)

    // Cria cliente Replicate
    const replicate = new Replicate({
      auth: validated.apiKey,
    })

    // Constrói input baseado na configuração
    const input = config.buildInput(validated)

    // Executa o modelo
    const output = await replicate.run(validated.modelId as `${string}/${string}`, { input })

    // Retorna resposta formatada
    return NextResponse.json({
      success: true,
      data: {
        id: crypto.randomUUID(),
        model: validated.modelId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "succeeded",
        input,
        output,
        error: null,
      },
    })
  } catch (error) {
    console.error("Generation error:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate",
      },
      { status: 500 },
    )
  }
}

const imageSchema = z.object({
  modelId: z.string().min(1),
  prompt: z.string().min(1),
  apiKey: z.string().min(1),
  aspectRatio: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})

/**
 * Configuração para geração de imagens
 */
export const imageGenerationConfig: GenerationConfig<z.infer<typeof imageSchema>> = {
  schema: imageSchema,
  buildInput: (validated) => {
    const input: Record<string, unknown> = {
      prompt: validated.prompt,
    }

    if (validated.aspectRatio) {
      input.aspect_ratio = validated.aspectRatio
    }

    if (validated.width) {
      input.width = validated.width
    }

    if (validated.height) {
      input.height = validated.height
    }

    return input
  },
}

const videoSchema = z.object({
  modelId: z.string().min(1),
  prompt: z.string().min(1),
  apiKey: z.string().min(1),
  imageUrl: z.string().optional(),
  duration: z.number().optional(),
})

/**
 * Configuração para geração de vídeos
 */
export const videoGenerationConfig: GenerationConfig<z.infer<typeof videoSchema>> = {
  schema: videoSchema,
  buildInput: (validated) => {
    const input: Record<string, unknown> = {
      prompt: validated.prompt,
    }

    if (validated.imageUrl) {
      input.image = validated.imageUrl
    }

    if (validated.duration) {
      input.duration = validated.duration
    }

    return input
  },
}
