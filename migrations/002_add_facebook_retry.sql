-- Migration: Suporte a Facebook e Sistema de Retry de Webhook
-- Execute no SQL Editor do Supabase

-- 1. Remover constraint antiga de tipo_postagem
ALTER TABLE "Controle de Postagens - Clientes Chiquinho"
  DROP CONSTRAINT IF EXISTS "Controle de Postagens - Clientes Chiquinho_tipo_postagem_check";

-- 2. Adicionar novo CHECK que aceita os 4 tipos de postagem
ALTER TABLE "Controle de Postagens - Clientes Chiquinho"
  ADD CONSTRAINT controle_postagens_tipo_check
  CHECK (tipo_postagem IN ('FEED', 'STORIES', 'FEED FACEBOOK', 'STORIES FACEBOOK'));

-- 3. Adicionar colunas do Facebook na tabela de clientes (caso ainda não existam)
ALTER TABLE "Clientes Chiquinho"
  ADD COLUMN IF NOT EXISTS id_pagina_facebook TEXT,
  ADD COLUMN IF NOT EXISTS token_facebook TEXT;

-- 4. Criar tabela de log de tentativas de retry de webhook
CREATE TABLE IF NOT EXISTS webhook_retry_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_instagram  TEXT NOT NULL,
  data_postagem DATE NOT NULL,
  tentativa     INT  NOT NULL DEFAULT 1,
  disparado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'success', 'failed')),
  FOREIGN KEY (id_instagram) REFERENCES "Clientes Chiquinho"(id_instagram) ON DELETE CASCADE
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_retry_log_cliente_data
  ON webhook_retry_log (id_instagram, data_postagem);

CREATE INDEX IF NOT EXISTS idx_retry_log_disparado_em
  ON webhook_retry_log (disparado_em);
