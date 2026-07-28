-- CreateTable
CREATE TABLE IF NOT EXISTS "UserPricing" (
    "id"        TEXT         NOT NULL,
    "userId"    INTEGER      NOT NULL,
    "category"  TEXT         NOT NULL,
    "itemName"  TEXT         NOT NULL,
    "unit"      TEXT         NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserPricing_userId_category_itemName_key"
    ON "UserPricing"("userId", "category", "itemName");

CREATE INDEX IF NOT EXISTS "UserPricing_userId_idx"
    ON "UserPricing"("userId");

-- AddForeignKey
-- Postgres has no ADD CONSTRAINT IF NOT EXISTS, so guard it: the constraint
-- already exists where the table was created by an earlier `prisma db push`.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserPricing_userId_fkey'
    ) THEN
        ALTER TABLE "UserPricing"
            ADD CONSTRAINT "UserPricing_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Also seed default assemblies if the Assembly table is empty
-- Run this separately if you want the default categories populated:
--
-- INSERT INTO "Assembly" (id, slug, name, trade, unit, "wastePct", "createdAt", "updatedAt") VALUES
-- (gen_random_uuid(), 'demo-site-prep',         'Demo / Site Prep',              'DEMO',      'sqft', 0.05, now(), now()),
-- (gen_random_uuid(), 'soil-preparation',        'Soil Preparation',              'SOIL_PREP', 'sqft', 0.05, now(), now()),
-- (gen_random_uuid(), 'concrete-flatwork',       'Concrete Flatwork',             'CONCRETE',  'sqft', 0.05, now(), now()),
-- (gen_random_uuid(), 'mulch-rock',              'Mulch / Rock',                  'MULCH_ROCK','sqft', 0.10, now(), now()),
-- (gen_random_uuid(), 'landscape-lighting',      'Landscape Lighting (Low Volt)', 'LIGHTING',  'each', 0.00, now(), now())
-- ON CONFLICT (slug) DO NOTHING;
