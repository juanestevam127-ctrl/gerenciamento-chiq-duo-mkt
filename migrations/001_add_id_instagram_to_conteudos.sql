-- Migration: Add id_instagram to Conteúdos Chiquinho Sorvetes
ALTER TABLE "chiquinho_sorvetes_conteudos"
ADD COLUMN IF NOT EXISTS "id_instagram" TEXT REFERENCES "chiquinho_sorvetes_clientes"("id_instagram") ON DELETE CASCADE;

-- Update index
CREATE INDEX IF NOT EXISTS idx_conteudos_id_instagram ON "chiquinho_sorvetes_conteudos"("id_instagram");
