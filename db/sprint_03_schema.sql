-- Sprint 3: Cadastro de parceiros + LP + PagBank + ClickSign
-- Executar no SQL Editor do Supabase

-- 1. Regioes com vagas
CREATE TABLE IF NOT EXISTS regioes (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  vagas_total INT DEFAULT 5,
  vagas_ocupadas INT DEFAULT 0,
  ordem INT DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Parceiros (corretores autonomos via LP publica)
CREATE TABLE IF NOT EXISTS parceiros (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  cpf_cnpj TEXT,
  creci TEXT,
  especialidade TEXT,
  regiao_id INT REFERENCES regioes(id) NOT NULL,
  corretor_id INT REFERENCES corretores(id),
  imobiliaria_id INT REFERENCES imobiliarias(id),
  status TEXT NOT NULL DEFAULT 'reservado',
  pagbank_subscription_id TEXT,
  pagbank_customer_id TEXT,
  clicksign_document_key TEXT,
  contract_signed_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,
  subscription_last_payment_at TIMESTAMPTZ,
  subscription_failed_at TIMESTAMPTZ,
  source_landing TEXT,
  ip_cadastro TEXT,
  user_agent_cadastro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Eventos de auditoria
CREATE TABLE IF NOT EXISTS parceiros_eventos (
  id SERIAL PRIMARY KEY,
  parceiro_id INT REFERENCES parceiros(id),
  tipo TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_parceiros_regiao ON parceiros(regiao_id, status);
CREATE INDEX IF NOT EXISTS idx_parceiros_status ON parceiros(status);
CREATE INDEX IF NOT EXISTS idx_parceiros_whatsapp ON parceiros(whatsapp);
CREATE INDEX IF NOT EXISTS idx_parceiros_eventos ON parceiros_eventos(parceiro_id, created_at DESC);

-- Seed de 15 regioes
INSERT INTO regioes (nome, slug, ordem) VALUES
  ('Lago Sul', 'lago-sul', 1),
  ('Lago Norte', 'lago-norte', 2),
  ('Park Way', 'park-way', 3),
  ('Vicente Pires', 'vicente-pires', 4),
  ('Arniqueira', 'arniqueira', 5),
  ('Aguas Claras', 'aguas-claras', 6),
  ('Noroeste', 'noroeste', 7),
  ('Sudoeste', 'sudoeste', 8),
  ('Asa Sul', 'asa-sul', 9),
  ('Asa Norte', 'asa-norte', 10),
  ('Jardim Botanico', 'jardim-botanico', 11),
  ('Sobradinho', 'sobradinho', 12),
  ('Taguatinga', 'taguatinga', 13),
  ('Guara', 'guara', 14),
  ('Jockey', 'jockey', 15)
ON CONFLICT (slug) DO NOTHING;
