-- AlterTable
ALTER TABLE "generations" ADD COLUMN     "personaId" TEXT;

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "gender" TEXT,
    "ageRange" TEXT,
    "ethnicity" TEXT,
    "bodyType" TEXT,
    "hairColor" TEXT,
    "hairStyle" TEXT,
    "eyeColor" TEXT,
    "distinctiveFeatures" TEXT,
    "styleDescription" TEXT,
    "niche" TEXT,
    "targetPlatform" TEXT,
    "contentTone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "referenceImageUrl" TEXT,
    "referenceImageId" TEXT,
    "basePrompt" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona_assets" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "prompt" TEXT,
    "modelId" TEXT,
    "metadata" JSONB,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "personas_userId_isActive_idx" ON "personas"("userId", "isActive");

-- CreateIndex
CREATE INDEX "personas_userId_createdAt_idx" ON "personas"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "personas_userId_slug_key" ON "personas"("userId", "slug");

-- CreateIndex
CREATE INDEX "persona_assets_personaId_type_idx" ON "persona_assets"("personaId", "type");

-- CreateIndex
CREATE INDEX "persona_assets_personaId_createdAt_idx" ON "persona_assets"("personaId", "createdAt");

-- CreateIndex
CREATE INDEX "generations_personaId_idx" ON "generations"("personaId");

-- AddForeignKey
ALTER TABLE "generations" ADD CONSTRAINT "generations_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_assets" ADD CONSTRAINT "persona_assets_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
