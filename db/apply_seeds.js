require('dotenv').config();
const { Client } = require('pg');

const seeds = [
  ['lago-norte', 2],
  ['jardim-botanico', 1],
  ['parkway-aguas-claras', 2],
  ['parkway-aeroporto', 3],
  ['asa-sul', 1],
  ['asa-norte', 2],
  ['sudoeste', 3],
  ['noroeste', 2],
  ['park-sul', 3],
  ['aguas-claras', 4],
  ['jockey', 2],
  ['vereda-da-cruz', 3],
  ['arniqueira', 3],
  ['vicente-pires', 2],
];

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query('ALTER TABLE regioes ADD COLUMN IF NOT EXISTS vagas_seed INT DEFAULT 0');
  console.log('column ok');
  for (const [slug, n] of seeds) {
    const r = await c.query('UPDATE regioes SET vagas_seed = $1 WHERE slug = $2 RETURNING id, nome, vagas_seed', [n, slug]);
    if (r.rowCount === 0) console.log('NOT FOUND:', slug);
    else console.log('  ' + r.rows[0].nome + ' -> seed ' + r.rows[0].vagas_seed);
  }
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
