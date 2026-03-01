import { CAMERA_MOVEMENTS, isCameraCapableModel } from '@/lib/constants/camera-control'
import type { CameraMovement } from '@/lib/types/camera-control'

/**
 * CameraControlService (SRP)
 * Responsabilidade única: enriquecer o input de geração de vídeo com parâmetros de câmera.
 * - Modelos com suporte nativo (ex: Kling): injeta `camera_type` no input.
 * - Demais modelos: appenda o texto descritivo ao prompt.
 */
export class CameraControlService {
  private static instance: CameraControlService

  private constructor() {}

  static getInstance(): CameraControlService {
    if (!CameraControlService.instance) {
      CameraControlService.instance = new CameraControlService()
    }
    return CameraControlService.instance
  }

  buildCameraInput(
    modelId: string,
    movement: CameraMovement | undefined,
    baseInput: Record<string, unknown>
  ): Record<string, unknown> {
    if (!movement || movement === 'static') return baseInput

    const config = CAMERA_MOVEMENTS[movement]
    if (!config) return baseInput

    if (isCameraCapableModel(modelId) && config.replicateParam) {
      return { ...baseInput, camera_type: config.replicateParam }
    }

    const currentPrompt = typeof baseInput.prompt === 'string' ? baseInput.prompt : ''
    return {
      ...baseInput,
      prompt: `${currentPrompt}, ${config.promptText}`,
    }
  }
}
