-- Sprint 1 Schema
-- Executar no SQL Editor do Supabase

-- 1. Imobiliarias
CREATE TABLE IF NOT EXISTS imobiliarias (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  responsavel TEXT,
  whatsapp_gestor TEXT,
  site TEXT,
  regras_comerciais TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Gestores
CREATE TABLE IF NOT EXISTS gestores (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT UNIQUE NOT NULL,
  email TEXT,
  imobiliaria_id INT REFERENCES imobiliarias(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Extensao de corretores
ALTER TABLE corretores ADD COLUMN IF NOT EXISTS creci TEXT;
ALTER TABLE corretores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE corretores ADD COLUMN IF NOT EXISTS especialidade TEXT;
ALTER TABLE corretores ADD COLUMN IF NOT EXISTS imobiliaria_id INT REFERENCES imobiliarias(id) ON DELETE SET NULL;
ALTER TABLE corretores ADD COLUMN IF NOT EXISTS autonomo BOOLEAN DEFAULT TRUE;

-- 4. Extensao de imoveis
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'publicado';
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'explicito';
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS publish_site BOOLEAN DEFAULT TRUE;
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS publish_instagram BOOLEAN DEFAULT FALSE;
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS publish_campanhas BOOLEAN DEFAULT FALSE;
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS publish_atendimento_privado BOOLEAN DEFAULT TRUE;
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS imobiliaria_id INT REFERENCES imobiliarias(id) ON DELETE SET NULL;
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS imported_by_phone TEXT;
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS curadoria_requested BOOLEAN DEFAULT FALSE;

-- 5. Sessao de galeria (token para web UI)
CREATE TABLE IF NOT EXISTS sessao_galeria (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  whatsapp TEXT NOT NULL,
  role TEXT NOT NULL,
  imobiliaria_id INT REFERENCES imobiliarias(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_imoveis_status ON imoveis(status);
CREATE INDEX IF NOT EXISTS idx_imoveis_visibility ON imoveis(visibility);
CREATE INDEX IF NOT EXISTS idx_imoveis_imobiliaria ON imoveis(imobiliaria_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_source_url ON imoveis(source_url);
CREATE INDEX IF NOT EXISTS idx_corretores_imobiliaria ON corretores(imobiliaria_id);
CREATE INDEX IF NOT EXISTS idx_gestores_whatsapp ON gestores(whatsapp);
CREATE INDEX IF NOT EXISTS idx_sessao_token ON sessao_galeria(token);
