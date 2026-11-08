/*
  Warnings:

  - A unique constraint covering the columns `[key_hash]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key_hash` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "key_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_hash_key" ON "ApiKey"("key_hash");
