-- Migration: Add id_instagram to Conteúdos Chiquinho Sorvetes
ALTER TABLE "Conteúdos Chiquinho Sorvetes"
ADD COLUMN IF NOT EXISTS "id_instagram" TEXT REFERENCES "Clientes Chiquinho"("id_instagram") ON DELETE CASCADE;

-- Update index
CREATE INDEX IF NOT EXISTS idx_conteudos_id_instagram ON "Conteúdos Chiquinho Sorvetes"("id_instagram");
