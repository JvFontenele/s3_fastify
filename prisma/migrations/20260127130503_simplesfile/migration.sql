/*
  Warnings:

  - You are about to drop the `Agreement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AgreementType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContractFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Agreement" DROP CONSTRAINT "Agreement_agreementTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_agreementId_fkey";

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_personId_fkey";

-- DropForeignKey
ALTER TABLE "ContractFile" DROP CONSTRAINT "ContractFile_contractId_fkey";

-- DropTable
DROP TABLE "Agreement";

-- DropTable
DROP TABLE "AgreementType";

-- DropTable
DROP TABLE "Contract";

-- DropTable
DROP TABLE "ContractFile";

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "PersonId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_PersonId_fkey" FOREIGN KEY ("PersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
