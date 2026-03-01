import type { CameraMovement, CameraMovementConfig } from '@/lib/types/camera-control'

export const CAMERA_MOVEMENTS: Record<CameraMovement, CameraMovementConfig> = {
  static: {
    id: 'static',
    label: 'Estático',
    icon: 'Square',
    promptText: 'static camera, locked shot, no camera movement',
    replicateParam: null,
  },
  pan_left: {
    id: 'pan_left',
    label: 'Pan Esquerda',
    icon: 'ArrowLeft',
    promptText: 'smooth camera pan to the left, horizontal camera movement',
    replicateParam: 'pan_left',
  },
  pan_right: {
    id: 'pan_right',
    label: 'Pan Direita',
    icon: 'ArrowRight',
    promptText: 'smooth camera pan to the right, horizontal camera movement',
    replicateParam: 'pan_right',
  },
  tilt_up: {
    id: 'tilt_up',
    label: 'Tilt Up',
    icon: 'ArrowUp',
    promptText: 'smooth camera tilt up, vertical upward camera movement',
    replicateParam: 'tilt_up',
  },
  tilt_down: {
    id: 'tilt_down',
    label: 'Tilt Down',
    icon: 'ArrowDown',
    promptText: 'smooth camera tilt down, vertical downward camera movement',
    replicateParam: 'tilt_down',
  },
  zoom_in: {
    id: 'zoom_in',
    label: 'Zoom In',
    icon: 'ZoomIn',
    promptText: 'slow cinematic zoom in, camera closing in on subject',
    replicateParam: 'zoom_in',
  },
  zoom_out: {
    id: 'zoom_out',
    label: 'Zoom Out',
    icon: 'ZoomOut',
    promptText: 'slow cinematic zoom out, camera pulling back from subject',
    replicateParam: 'zoom_out',
  },
  orbit_left: {
    id: 'orbit_left',
    label: 'Orbit Esquerda',
    icon: 'RotateCcw',
    promptText: 'cinematic orbital camera movement circling left around subject',
    replicateParam: 'orbit_left',
  },
  orbit_right: {
    id: 'orbit_right',
    label: 'Orbit Direita',
    icon: 'RotateCw',
    promptText: 'cinematic orbital camera movement circling right around subject',
    replicateParam: 'orbit_right',
  },
  dolly_in: {
    id: 'dolly_in',
    label: 'Dolly In',
    icon: 'Maximize2',
    promptText: 'smooth dolly in movement, camera physically moving forward toward subject',
    replicateParam: 'dolly_in',
  },
  dolly_out: {
    id: 'dolly_out',
    label: 'Dolly Out',
    icon: 'Minimize2',
    promptText: 'smooth dolly out movement, camera physically moving backward from subject',
    replicateParam: 'dolly_out',
  },
  crane_up: {
    id: 'crane_up',
    label: 'Crane Up',
    icon: 'TrendingUp',
    promptText: 'cinematic crane shot moving upward, camera elevating vertically',
    replicateParam: 'crane_up',
  },
  crane_down: {
    id: 'crane_down',
    label: 'Crane Down',
    icon: 'TrendingDown',
    promptText: 'cinematic crane shot moving downward, camera descending vertically',
    replicateParam: 'crane_down',
  },
}

export const CAMERA_MOVEMENT_LIST = Object.values(CAMERA_MOVEMENTS)

/**
 * Modelos que aceitam parâmetro nativo de controle de câmera via Replicate.
 * Para outros modelos, o camera control é injetado como texto no prompt.
 */
export const CAMERA_CAPABLE_MODELS: string[] = [
  'fofr/kling-v1.5-pro',
  'klingai/kling-v1-5-pro',
]

export function isCameraCapableModel(modelId: string): boolean {
  return CAMERA_CAPABLE_MODELS.some((m) => modelId.toLowerCase().includes(m.toLowerCase()))
}
