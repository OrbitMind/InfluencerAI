import Replicate from 'replicate'
import { ProductAssetRepository } from '@/lib/repositories/product-asset.repository'
import { getStorageService } from '@/lib/services/storage/factory'
import { BACKGROUND_REMOVAL_MODEL } from '@/lib/constants/fashion-models'
import type { ProductAssetData, CreateProductAssetDTO, ProductAssetFilters } from '@/lib/types/fashion'

/**
 * ProductAssetService (SRP)
 * Responsabilidade única: CRUD de assets de produto e remoção de background.
 */
export class ProductAssetService {
  private repository = new ProductAssetRepository()
  private storage = getStorageService()

  async list(userId: string, filters: ProductAssetFilters = {}) {
    return this.repository.findByUserId(userId, filters)
  }

  async get(userId: string, id: string): Promise<ProductAssetData> {
    const asset = await this.repository.findById(userId, id)
    if (!asset) throw new Error('Produto não encontrado')
    return asset
  }

  async create(userId: string, data: CreateProductAssetDTO): Promise<ProductAssetData> {
    return this.repository.create(userId, data)
  }

  async removeBackground(userId: string, id: string, replicateKey: string): Promise<ProductAssetData> {
    const asset = await this.get(userId, id)

    const replicate = new Replicate({ auth: replicateKey, useFileOutput: false })
    const output = await replicate.run(BACKGROUND_REMOVAL_MODEL as `${string}/${string}`, {
      input: { image: asset.imageUrl },
    })

    const bgRemovedUrl = Array.isArray(output) ? output[0] : (output as string)
    if (!bgRemovedUrl || typeof bgRemovedUrl !== 'string') {
      throw new Error('Falha ao remover background via Replicate')
    }

    const uploaded = await this.storage.upload({
      url: bgRemovedUrl,
      userId,
      type: 'image',
    })

    return this.repository.updateBgRemoved(userId, id, uploaded.url, uploaded.publicId)
  }

  async delete(userId: string, id: string): Promise<void> {
    const asset = await this.get(userId, id)
    await Promise.allSettled([
      asset.publicId ? this.storage.delete(asset.publicId) : Promise.resolve(),
      asset.bgRemovedId ? this.storage.delete(asset.bgRemovedId) : Promise.resolve(),
    ])
    await this.repository.delete(userId, id)
  }
}
