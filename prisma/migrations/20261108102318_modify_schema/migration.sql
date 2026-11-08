/*
  Warnings:

  - The values [LAPTOP] on the enum `DEVICE` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DEVICE_new" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET', 'UNKNOWN');
ALTER TABLE "public"."Event" ALTER COLUMN "device" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "device" TYPE "DEVICE_new" USING ("device"::text::"DEVICE_new");
ALTER TYPE "DEVICE" RENAME TO "DEVICE_old";
ALTER TYPE "DEVICE_new" RENAME TO "DEVICE";
DROP TYPE "public"."DEVICE_old";
ALTER TABLE "Event" ALTER COLUMN "device" SET DEFAULT 'DESKTOP';
COMMIT;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;
