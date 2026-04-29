require('dotenv').config();
const { Client } = require('pg');
const supabase = require('../src/config/supabase');

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query("DELETE FROM imoveis WHERE titulo LIKE 'TEST_AUTO_%'");
  await c.query("DELETE FROM parceiros WHERE nome LIKE 'TEST_AUTOASSIGN_%'");

  const cor = await c.query("INSERT INTO parceiros (nome, whatsapp, email, cpf_cnpj, status, regiao_id, tipo_parceiro) VALUES ('TEST_AUTOASSIGN_Corretor', '61988887777', 'a@b.com', '99988877766', 'ocupado', 2, 'corretor') RETURNING id");
  const corId = cor.rows[0].id;
  const imob = await c.query("INSERT INTO parceiros (nome, whatsapp, email, cpf_cnpj, status, regiao_id, tipo_parceiro) VALUES ('TEST_AUTOASSIGN_Imob', '61988886666', 'i@b.com', '11122233000144', 'ocupado', 2, 'imobiliaria') RETURNING id");
  const imobId = imob.rows[0].id;
  console.log('corretor parceiro id:', corId);
  console.log('imobiliaria parceiro id:', imobId);

  // Test auto-assign lookup logic (mirrors importFromUrl)
  for (const phone of ['61988887777', '61988886666']) {
    const { data: parc } = await supabase
      .from('parceiros')
      .select('id, tipo_parceiro, nome, status')
      .eq('whatsapp', phone)
      .in('status', ['reservado', 'ocupado'])
      .maybeSingle();
    if (parc && parc.tipo_parceiro === 'corretor') {
      console.log('Phone ' + phone + ' -> AUTO-ASSIGN to parceiro ' + parc.id + ' (' + parc.nome + ')');
    } else if (parc) {
      console.log('Phone ' + phone + ' -> parceiro ' + parc.id + ' is ' + parc.tipo_parceiro + ' -> NO auto-assign');
    } else {
      console.log('Phone ' + phone + ' -> not found');
    }
  }

  // Cleanup
  await c.query("DELETE FROM parceiros WHERE nome LIKE 'TEST_AUTOASSIGN_%'");
  await c.end();
  console.log('cleaned');
})().catch(e => { console.error(e.message); process.exit(1); });
