-- AlterTable
ALTER TABLE "personas" ADD COLUMN     "voiceId" TEXT,
ADD COLUMN     "voiceName" TEXT,
ADD COLUMN     "voicePreviewUrl" TEXT,
ADD COLUMN     "voiceProvider" TEXT,
ADD COLUMN     "voiceSettings" JSONB;
