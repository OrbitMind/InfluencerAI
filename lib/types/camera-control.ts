export type CameraMovement =
  | 'static'
  | 'pan_left'
  | 'pan_right'
  | 'tilt_up'
  | 'tilt_down'
  | 'zoom_in'
  | 'zoom_out'
  | 'orbit_left'
  | 'orbit_right'
  | 'dolly_in'
  | 'dolly_out'
  | 'crane_up'
  | 'crane_down'

export interface CameraMovementConfig {
  id: CameraMovement
  label: string
  icon: string          // nome do ícone Lucide
  promptText: string    // texto a ser injetado no prompt para modelos sem suporte nativo
  replicateParam: string | null // nome do param nativo (null = não suportado)
}

export interface CameraControlInput {
  prompt: string
  cameraType?: string   // param nativo do modelo (ex: Kling)
}
