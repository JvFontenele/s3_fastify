/*
  Warnings:

  - You are about to drop the column `PersonId` on the `File` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_PersonId_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "PersonId",
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "personId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_key_key" ON "File"("key");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
