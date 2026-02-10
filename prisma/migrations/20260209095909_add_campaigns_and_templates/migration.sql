-- CreateTable
CREATE TABLE "campaign_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "imagePromptTemplate" TEXT,
    "videoPromptTemplate" TEXT,
    "narrationTemplate" TEXT,
    "defaultImageModel" TEXT,
    "defaultVideoModel" TEXT,
    "defaultAspectRatio" TEXT,
    "defaultVideoDuration" INTEGER,
    "overlayConfig" JSONB,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "personaId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "variables" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "errorMessage" TEXT,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "videoUrl" TEXT,
    "videoPublicId" TEXT,
    "videoThumbnailUrl" TEXT,
    "audioUrl" TEXT,
    "audioPublicId" TEXT,
    "composedImageUrl" TEXT,
    "composedImagePublicId" TEXT,
    "executionLog" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_templates_slug_key" ON "campaign_templates"("slug");

-- CreateIndex
CREATE INDEX "campaign_templates_category_idx" ON "campaign_templates"("category");

-- CreateIndex
CREATE INDEX "campaign_templates_isSystem_isActive_idx" ON "campaign_templates"("isSystem", "isActive");

-- CreateIndex
CREATE INDEX "campaigns_userId_status_idx" ON "campaigns"("userId", "status");

-- CreateIndex
CREATE INDEX "campaigns_userId_createdAt_idx" ON "campaigns"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "campaigns_personaId_idx" ON "campaigns"("personaId");

-- CreateIndex
CREATE INDEX "campaigns_templateId_idx" ON "campaigns"("templateId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "campaign_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
