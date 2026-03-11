-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "allowedTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
