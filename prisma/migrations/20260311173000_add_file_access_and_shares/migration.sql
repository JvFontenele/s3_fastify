-- AlterTable
ALTER TABLE "File"
ADD COLUMN "accessKey" TEXT,
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

UPDATE "File"
SET "accessKey" = md5(random()::text || clock_timestamp()::text || id::text)
WHERE "accessKey" IS NULL;

ALTER TABLE "File"
ALTER COLUMN "accessKey" SET NOT NULL;

-- CreateTable
CREATE TABLE "FileShare" (
  "id" SERIAL NOT NULL,
  "fileId" INTEGER NOT NULL,
  "personId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FileShare_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "File_accessKey_key" ON "File"("accessKey");
CREATE UNIQUE INDEX "FileShare_fileId_personId_key" ON "FileShare"("fileId", "personId");
CREATE INDEX "FileShare_personId_idx" ON "FileShare"("personId");

-- Foreign Keys
ALTER TABLE "FileShare"
ADD CONSTRAINT "FileShare_fileId_fkey"
FOREIGN KEY ("fileId") REFERENCES "File"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FileShare"
ADD CONSTRAINT "FileShare_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "Person"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
