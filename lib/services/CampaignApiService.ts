import type {
  CampaignData,
  CampaignTemplateData,
  CreateCampaignDTO,
  UpdateCampaignDTO,
  CampaignFilters,
  PaginatedCampaigns,
  ExecuteCampaignOptions,
} from '@/lib/types/campaign';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class CampaignApiService {
  async listTemplates(params?: { category?: string; search?: string }): Promise<ApiResponse<CampaignTemplateData[]>> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);

    const response = await fetch(`/api/templates?${searchParams.toString()}`);
    return response.json();
  }

  async getTemplate(id: string): Promise<ApiResponse<CampaignTemplateData>> {
    const response = await fetch(`/api/templates/${id}`);
    return response.json();
  }

  async listCampaigns(filters?: CampaignFilters): Promise<ApiResponse<PaginatedCampaigns>> {
    const searchParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/campaigns?${searchParams.toString()}`);
    return response.json();
  }

  async getCampaign(id: string): Promise<ApiResponse<CampaignData>> {
    const response = await fetch(`/api/campaigns/${id}`);
    return response.json();
  }

  async createCampaign(data: CreateCampaignDTO): Promise<ApiResponse<CampaignData>> {
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateCampaign(id: string, data: UpdateCampaignDTO): Promise<ApiResponse<CampaignData>> {
    const response = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteCampaign(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    return response.json();
  }

  async executeCampaign(id: string, options?: ExecuteCampaignOptions): Promise<ApiResponse<CampaignData>> {
    const response = await fetch(`/api/campaigns/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    return response.json();
  }

  async duplicateCampaign(id: string): Promise<ApiResponse<CampaignData>> {
    const response = await fetch(`/api/campaigns/${id}/duplicate`, {
      method: 'POST',
    });
    return response.json();
  }

  async downloadSubtitles(id: string, format: 'srt' | 'ass' = 'srt'): Promise<Response> {
    return fetch(`/api/campaigns/${id}/subtitles?format=${format}`);
  }
}

export const campaignApiService = new CampaignApiService();
