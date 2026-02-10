export type CampaignStatus = 'draft' | 'running' | 'completed' | 'failed';

export type ExecutionStep = 'image' | 'video' | 'audio' | 'lip-sync' | 'compose' | 'captions';

export interface TemplateVariable {
  name: string;
  label: string;
  required: boolean;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
}

export interface OverlayConfig {
  enabled: boolean;
  position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  opacity: number;
  padding: number;
  text?: string;
}

export interface ExecutionLogEntry {
  step: ExecutionStep;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  details?: string;
  error?: string;
}

export interface CampaignTemplateData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  icon: string | null;
  imagePromptTemplate: string | null;
  videoPromptTemplate: string | null;
  narrationTemplate: string | null;
  defaultImageModel: string | null;
  defaultVideoModel: string | null;
  defaultAspectRatio: string | null;
  defaultVideoDuration: number | null;
  overlayConfig: OverlayConfig | null;
  variables: TemplateVariable[];
  isSystem: boolean;
  isActive: boolean;
  _count: { campaigns: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignData {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  personaId: string;
  templateId: string;
  variables: Record<string, string> | null;
  status: CampaignStatus;
  errorMessage: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  videoUrl: string | null;
  videoPublicId: string | null;
  videoThumbnailUrl: string | null;
  audioUrl: string | null;
  audioPublicId: string | null;
  composedImageUrl: string | null;
  composedImagePublicId: string | null;
  captionPresetId: string | null;
  captionCustomStyle: Record<string, unknown> | null;
  captionSegmentationMode: string | null;
  subtitleData: Record<string, unknown> | null;
  srtUrl: string | null;
  composedVideoUrl: string | null;
  composedVideoPublicId: string | null;
  useLipSync: boolean;
  lipSyncModel: string | null;
  lipSyncVideoUrl: string | null;
  lipSyncVideoPublicId: string | null;
  executionLog: ExecutionLogEntry[] | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  persona: {
    id: string;
    name: string;
    referenceImageUrl: string | null;
    voiceId: string | null;
    voiceName: string | null;
  };
  template: {
    id: string;
    name: string;
    category: string;
    icon: string | null;
  };
}

export interface CreateCampaignDTO {
  name: string;
  description?: string;
  personaId: string;
  templateId: string;
  variables?: Record<string, string>;
  captionPresetId?: string;
  captionCustomStyle?: Record<string, unknown>;
  captionSegmentationMode?: string;
  useLipSync?: boolean;
  lipSyncModel?: string;
}

export interface UpdateCampaignDTO {
  name?: string;
  description?: string;
  variables?: Record<string, string>;
  captionPresetId?: string;
  captionCustomStyle?: Record<string, unknown>;
  captionSegmentationMode?: string;
  useLipSync?: boolean;
  lipSyncModel?: string;
}

export interface ExecuteCampaignOptions {
  steps?: ExecutionStep[];
  imageModel?: string;
  videoModel?: string;
  aspectRatio?: string;
  videoDuration?: number;
  captionPresetId?: string;
  captionCustomStyle?: Record<string, unknown>;
  useLipSync?: boolean;
  lipSyncModel?: string;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  personaId?: string;
  templateId?: string;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'name' | 'updatedAt';
  orderDir?: 'asc' | 'desc';
}

export interface PaginatedCampaigns {
  campaigns: CampaignData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const CAMPAIGN_CATEGORIES = [
  { value: 'product', label: 'Produto', icon: 'Package' },
  { value: 'lifestyle', label: 'Lifestyle', icon: 'Heart' },
  { value: 'educational', label: 'Educacional', icon: 'GraduationCap' },
  { value: 'promotional', label: 'Promocional', icon: 'Megaphone' },
  { value: 'fitness', label: 'Fitness', icon: 'Dumbbell' },
  { value: 'entertainment', label: 'Entretenimento', icon: 'Sparkles' },
] as const;

export const CAMPAIGN_STATUSES = [
  { value: 'draft' as const, label: 'Rascunho', color: 'secondary' },
  { value: 'running' as const, label: 'Executando', color: 'warning' },
  { value: 'completed' as const, label: 'Concluída', color: 'success' },
  { value: 'failed' as const, label: 'Falhou', color: 'destructive' },
] as const;
