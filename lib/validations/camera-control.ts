import { z } from 'zod'
import { CAMERA_MOVEMENT_LIST } from '@/lib/constants/camera-control'

const validMovements = CAMERA_MOVEMENT_LIST.map((m) => m.id) as [string, ...string[]]

export const cameraMovementSchema = z.enum(validMovements as [string, ...string[]]).optional()
