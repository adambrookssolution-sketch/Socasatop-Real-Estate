-- Sprint 2: Curadoria com IA + Sistema de creditos
-- Executar no SQL Editor do Supabase

-- 1. Pacotes de creditos disponiveis
CREATE TABLE IF NOT EXISTS pacotes_creditos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  imagens INT NOT NULL,
  preco_centavos INT NOT NULL,
  validade_dias INT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Saldo de creditos por parceiro
CREATE TABLE IF NOT EXISTS creditos_saldo (
  id SERIAL PRIMARY KEY,
  parceiro_tipo TEXT NOT NULL,
  parceiro_id INT NOT NULL,
  creditos_disponiveis INT DEFAULT 0,
  validade_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parceiro_tipo, parceiro_id)
);

-- 3. Transacoes de creditos
CREATE TABLE IF NOT EXISTS creditos_transacoes (
  id SERIAL PRIMARY KEY,
  parceiro_tipo TEXT NOT NULL,
  parceiro_id INT NOT NULL,
  tipo TEXT NOT NULL,
  quantidade INT NOT NULL,
  saldo_apos INT NOT NULL,
  pacote_id INT REFERENCES pacotes_creditos(id),
  imovel_id INT REFERENCES imoveis(id),
  pagamento_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Jobs de curadoria
CREATE TABLE IF NOT EXISTS curadoria_jobs (
  id SERIAL PRIMARY KEY,
  imovel_id INT REFERENCES imoveis(id) NOT NULL,
  solicitado_por_phone TEXT,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  versao_anterior JSONB,
  versao_nova JSONB,
  custo_creditos INT DEFAULT 0,
  iniciado_at TIMESTAMPTZ,
  pronto_at TIMESTAMPTZ,
  aprovado_at TIMESTAMPTZ,
  erro_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_creditos_saldo_parceiro ON creditos_saldo(parceiro_tipo, parceiro_id);
CREATE INDEX IF NOT EXISTS idx_creditos_trans_parceiro ON creditos_transacoes(parceiro_tipo, parceiro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_curadoria_jobs_imovel ON curadoria_jobs(imovel_id, status);
CREATE INDEX IF NOT EXISTS idx_curadoria_jobs_status ON curadoria_jobs(status, created_at DESC);

-- Seed de pacotes
INSERT INTO pacotes_creditos (nome, imagens, preco_centavos, validade_dias) VALUES
  ('Trial', 5, 1900, 30),
  ('Basic', 25, 8900, 30),
  ('Pro', 100, 29900, 60),
  ('Premium', 300, 74900, 60)
ON CONFLICT DO NOTHING;
