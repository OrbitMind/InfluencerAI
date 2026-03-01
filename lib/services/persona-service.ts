import { createLogger } from '@/lib/utils/logger';
import { PersonaRepository } from '@/lib/repositories/persona.repository';
import { PersonaAssetRepository } from '@/lib/repositories/persona-asset.repository';
import { SlugService } from './slug-service';
import { PromptBuilderService } from './prompt-builder-service';
import { getStorageService } from './storage/factory';
import type { CreatePersonaDTO, UpdatePersonaDTO, PersonaFilters, PersonaAttributes } from '@/lib/types/persona';
import type { PersonaVoiceConfig } from '@/lib/types/voice';
import { Prisma } from '@prisma/client';
import { toJsonValue } from '@/lib/utils/prisma-helpers';

const logger = createLogger('PersonaService');

const VISUAL_FIELDS: (keyof PersonaAttributes)[] = [
  'name', 'bio', 'gender', 'ageRange', 'ethnicity', 'bodyType',
  'hairColor', 'hairStyle', 'eyeColor',
  'distinctiveFeatures', 'styleDescription',
  'niche', 'targetPlatform', 'contentTone', 'language',
];

export class PersonaService {
  private repository = new PersonaRepository();
  private assetRepository = new PersonaAssetRepository();

  async createPersona(userId: string, data: CreatePersonaDTO) {
    logger.info('[PersonaService.createPersona] Iniciando criação');
    logger.info('[PersonaService.createPersona] userId:', { userId });
    logger.info('[PersonaService.createPersona] data:', { data });

    const slug = await SlugService.generateUniqueSlug(
      data.name,
      userId,
      (s, u) => this.repository.slugExists(s, u)
    );
    logger.info('[PersonaService.createPersona] slug gerado:', { slug });

    const basePrompt = PromptBuilderService.buildBasePrompt(data);
    logger.info('[PersonaService.createPersona] basePrompt gerado');

    const persona = await this.repository.create(userId, { ...data, slug, basePrompt });
    logger.info('[PersonaService.createPersona] Persona criada no DB:', {
      id: persona.id,
      name: persona.name,
      userId: persona.userId
    });

    return persona;
  }

  async updatePersona(userId: string, personaId: string, data: UpdatePersonaDTO) {
    const existing = await this.repository.findById(personaId, userId);
    if (!existing) throw new Error('Persona não encontrada');

    let slug: string | undefined;
    if (data.name && data.name !== existing.name) {
      slug = await SlugService.generateUniqueSlug(
        data.name,
        userId,
        (s, u) => this.repository.slugExists(s, u)
      );
    }

    const visualChanged = VISUAL_FIELDS.some(
      (field) => data[field] !== undefined && data[field] !== (existing as Record<string, unknown>)[field]
    );

    let basePrompt: string | undefined;
    if (visualChanged) {
      const merged: PersonaAttributes = {};
      for (const field of VISUAL_FIELDS) {
        (merged as Record<string, unknown>)[field] =
          data[field] !== undefined ? data[field] : (existing as Record<string, unknown>)[field];
      }
      basePrompt = PromptBuilderService.buildBasePrompt(merged);
    }

    return this.repository.update(personaId, userId, { ...data, slug, basePrompt });
  }

  async deletePersona(userId: string, personaId: string) {
    const persona = await this.repository.findById(personaId, userId);
    if (!persona) throw new Error('Persona não encontrada');

    const storage = getStorageService();

    // Delete assets from storage
    for (const asset of persona.assets) {
      if (asset.publicId) {
        try {
          await storage.delete(asset.publicId);
        } catch {
          // Continue even if storage delete fails
        }
      }
    }

    // Delete reference image from storage
    if (persona.referenceImageId) {
      try {
        await storage.delete(persona.referenceImageId);
      } catch {
        // Continue
      }
    }

    await this.repository.delete(personaId, userId);
  }

  async archivePersona(userId: string, personaId: string) {
    const persona = await this.repository.findById(personaId, userId);
    if (!persona) throw new Error('Persona não encontrada');

    return this.repository.archive(personaId, userId, !persona.isArchived);
  }

  async getPersona(userId: string, personaId: string) {
    const persona = await this.repository.findById(personaId, userId);
    if (!persona) throw new Error('Persona não encontrada');
    return persona;
  }

  async listPersonas(userId: string, filters?: PersonaFilters) {
    logger.info('[PersonaService.listPersonas] Iniciando listagem');
    logger.info('[PersonaService.listPersonas] userId:', { userId });
    logger.info('[PersonaService.listPersonas] filters:', { filters });

    const { personas, total } = await this.repository.findAllByUser(userId, filters);
    logger.info('[PersonaService.listPersonas] Resultado do repository:', {
      total,
      personasCount: personas.length,
      personasIds: personas.map(p => p.id)
    });

    const page = filters?.page || 1;
    const limit = filters?.limit || 12;

    const result = {
      personas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    logger.info('[PersonaService.listPersonas] Retornando resultado:', {
      personasCount: result.personas.length,
      pagination: result.pagination
    });

    return result;
  }

  async addAsset(userId: string, personaId: string, data: {
    type: string;
    url: string;
    publicId?: string;
    prompt?: string;
    modelId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const persona = await this.repository.findById(personaId, userId);
    if (!persona) throw new Error('Persona não encontrada');

    return this.assetRepository.create({ personaId, ...data });
  }

  async removeAsset(userId: string, personaId: string, assetId: string) {
    const persona = await this.repository.findById(personaId, userId);
    if (!persona) throw new Error('Persona não encontrada');

    const asset = await this.assetRepository.findById(assetId);
    if (!asset || asset.personaId !== personaId) throw new Error('Asset não encontrado');

    if (asset.publicId) {
      const storage = getStorageService();
      try {
        await storage.delete(asset.publicId);
      } catch {
        // Continue
      }
    }

    await this.assetRepository.delete(assetId);
  }

  async toggleAssetFavorite(userId: string, personaId: string, assetId: string) {
    const persona = await this.repository.findById(personaId, userId);
    if (!persona) throw new Error('Persona não encontrada');

    const asset = await this.assetRepository.findById(assetId);
    if (!asset || asset.personaId !== personaId) throw new Error('Asset não encontrado');

    return this.assetRepository.toggleFavorite(assetId);
  }

  async setReferenceImage(userId: string, personaId: string, imageUrl: string, publicId?: string) {
    const persona = await this.repository.findById(personaId, userId);
    if (!persona) throw new Error('Persona não encontrada');

    // Delete old reference from storage
    if (persona.referenceImageId) {
      const storage = getStorageService();
      try {
        await storage.delete(persona.referenceImageId);
      } catch {
        // Continue
      }
    }

    return this.repository.update(personaId, userId, {
      referenceImageUrl: imageUrl,
      referenceImageId: publicId ?? null,
    });
  }

  async setVoice(userId: string, personaId: string, config: PersonaVoiceConfig) {
    const persona = await this.repository.findById(personaId, userId);
    if (!persona) throw new Error('Persona não encontrada');

    return this.repository.update(personaId, userId, {
      voiceProvider: config.voiceProvider,
      voiceId: config.voiceId,
      voiceName: config.voiceName,
      voicePreviewUrl: config.voicePreviewUrl,
      voiceSettings: toJsonValue(config.voiceSettings as unknown as Record<string, unknown>),
    });
  }

  async removeVoice(userId: string, personaId: string) {
    const persona = await this.repository.findById(personaId, userId);
    if (!persona) throw new Error('Persona não encontrada');

    return this.repository.update(personaId, userId, {
      voiceProvider: null,
      voiceId: null,
      voiceName: null,
      voicePreviewUrl: null,
      voiceSettings: Prisma.DbNull,
    });
  }
}
