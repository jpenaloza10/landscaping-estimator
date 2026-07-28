-- Add company logo storage path to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "logo_path" TEXT;
