-- Sprint 3b: Multiplas regioes por parceiro

CREATE TABLE IF NOT EXISTS parceiros_regioes (
  id SERIAL PRIMARY KEY,
  parceiro_id INT REFERENCES parceiros(id) ON DELETE CASCADE NOT NULL,
  regiao_id INT REFERENCES regioes(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'reservado',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parceiro_id, regiao_id)
);

CREATE INDEX IF NOT EXISTS idx_parc_reg_parceiro ON parceiros_regioes(parceiro_id, status);
CREATE INDEX IF NOT EXISTS idx_parc_reg_regiao ON parceiros_regioes(regiao_id, status);

-- Migrar dados existentes
INSERT INTO parceiros_regioes (parceiro_id, regiao_id, status, added_at)
SELECT id, regiao_id, status, created_at FROM parceiros WHERE regiao_id IS NOT NULL
ON CONFLICT DO NOTHING;
