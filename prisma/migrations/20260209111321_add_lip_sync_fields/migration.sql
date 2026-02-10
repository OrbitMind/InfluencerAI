-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "lipSyncModel" TEXT,
ADD COLUMN     "lipSyncVideoPublicId" TEXT,
ADD COLUMN     "lipSyncVideoUrl" TEXT,
ADD COLUMN     "useLipSync" BOOLEAN NOT NULL DEFAULT false;
