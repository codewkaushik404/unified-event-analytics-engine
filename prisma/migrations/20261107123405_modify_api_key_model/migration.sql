/*
  Warnings:

  - You are about to drop the column `key_hash` on the `ApiKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[encrypted_key,iv]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `auth_tag` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `encrypted_key` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iv` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ApiKey_key_hash_key";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "key_hash",
ADD COLUMN     "auth_tag" TEXT NOT NULL,
ADD COLUMN     "encrypted_key" TEXT NOT NULL,
ADD COLUMN     "iv" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_encrypted_key_iv_key" ON "ApiKey"("encrypted_key", "iv");
