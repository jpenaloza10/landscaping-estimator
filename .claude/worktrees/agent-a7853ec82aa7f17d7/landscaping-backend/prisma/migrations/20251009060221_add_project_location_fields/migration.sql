-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE INDEX "Project_city_state_country_idx" ON "Project"("city", "state", "country");

-- CreateIndex
CREATE INDEX "Project_latitude_longitude_idx" ON "Project"("latitude", "longitude");
