-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "captionCustomStyle" JSONB,
ADD COLUMN     "captionPresetId" TEXT,
ADD COLUMN     "captionSegmentationMode" TEXT DEFAULT 'timed',
ADD COLUMN     "composedVideoPublicId" TEXT,
ADD COLUMN     "composedVideoUrl" TEXT,
ADD COLUMN     "srtUrl" TEXT,
ADD COLUMN     "subtitleData" JSONB;
