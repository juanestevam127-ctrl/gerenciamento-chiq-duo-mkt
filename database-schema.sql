-- Tabela: Clientes Chiquinho
CREATE TABLE IF NOT EXISTS "Clientes Chiquinho" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  username_instagram TEXT NOT NULL,
  id_instagram TEXT NOT NULL UNIQUE,
  horario_postagem TIME,
  token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Conteúdos Chiquinho Sorvetes
CREATE TABLE IF NOT EXISTS "Conteúdos Chiquinho Sorvetes" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_postagem DATE NOT NULL,
  descricao TEXT,
  imagem_estatica TEXT,
  carrossel JSONB,
  reels TEXT,
  stories TEXT,
  id_instagram TEXT REFERENCES "Clientes Chiquinho"(id_instagram) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Controle de Postagens - Clientes Chiquinho
CREATE TABLE IF NOT EXISTS "Controle de Postagens - Clientes Chiquinho" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_postagem DATE NOT NULL,
  id_instagram TEXT NOT NULL REFERENCES "Clientes Chiquinho"(id_instagram) ON DELETE CASCADE,
  tipo_postagem TEXT NOT NULL CHECK (tipo_postagem IN ('FEED', 'STORIES')),
  conteudo_id UUID REFERENCES "Conteúdos Chiquinho Sorvetes"(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_id_instagram ON clientes_chiquinho(id_instagram);
CREATE INDEX IF NOT EXISTS idx_conteudos_data_postagem ON conteudos_chiquinho_sorvetes(data_postagem);
CREATE INDEX IF NOT EXISTS idx_postagens_data ON controle_postagens_clientes_chiquinho(data_postagem);
CREATE INDEX IF NOT EXISTS idx_postagens_cliente ON controle_postagens_clientes_chiquinho(id_instagram);

-- Comentários nas tabelas
COMMENT ON TABLE clientes_chiquinho IS 'Armazena informações dos clientes do Instagram';
COMMENT ON TABLE conteudos_chiquinho_sorvetes IS 'Armazena conteúdos agendados para postagem';
COMMENT ON TABLE controle_postagens_clientes_chiquinho IS 'Controla quais postagens foram realizadas';
