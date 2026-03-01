export interface ReplicateModel {
  url: string
  owner: string
  name: string
  description: string
  visibility: string
  github_url: string | null
  paper_url: string | null
  license_url: string | null
  run_count: number
  cover_image_url: string | null
  default_example: unknown
  latest_version: {
    id: string
    created_at: string
    cog_version: string
    openapi_schema: unknown
  } | null
}

export interface ReplicateCollectionResponse {
  name: string
  slug: string
  description: string
  models: ReplicateModel[]
}

export interface ReplicateSearchResponse {
  results: ReplicateModel[]
  next: string | null
  previous: string | null
}

export interface TransformedModel {
  id: string
  name: string
  description: string
  provider: string
  type: 'image' | 'video'
  runCount: number
  coverImage: string | null
  sourceImageParam?: string   // param name for passing source image (e.g. 'image', 'first_frame_image')
  supportsImageInput?: boolean
}
