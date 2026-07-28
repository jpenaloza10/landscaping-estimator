-- AlterTable
-- IF NOT EXISTS: these columns were created by an earlier `prisma db push`
-- on some environments, so a plain ADD COLUMN fails there with 42701.
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
