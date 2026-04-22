const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

process.on('uncaughtException', (err) => { console.error('UNCAUGHT:', err.message, err.stack); });
process.on('unhandledRejection', (err) => { console.error('UNHANDLED:', err.message || err, err.stack || ''); });

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', project: 'Só Casa Top API', version: '1.0.0' });
});

// Rotas
app.use('/webhook/whatsapp', require('./routes/whatsapp'));
app.use('/webhook/instagram', require('./routes/instagram'));
app.use('/api/imoveis', require('./routes/imoveis'));
app.use('/api/corretores', require('./routes/corretores'));

// Página visual do imóvel (with cache)
const { renderImovel } = require('./views/imovel');
const supabaseView = require('./config/supabase');
const imovelCache = new Map();

app.get('/imovel/:id', async (req, res) => {
  const id = req.params.id;

  // Check cache first (5 min TTL)
  const cached = imovelCache.get(id);
  if (cached && Date.now() - cached.time < 300000) {
    return res.send(cached.html);
  }

  try {
    const { data, error } = await supabaseView.from('imoveis').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).send('<h1>Imóvel não encontrado</h1>');
    let corretor = null;
    if (data.corretor_id) {
      const r = await supabaseView.from('corretores').select('nome,whatsapp').eq('id', data.corretor_id).single();
      if (r.data) corretor = r.data;
    }
    // Fallback: find corretor by region
    if (!corretor && data.neighborhood) {
      const r = await supabaseView.from('corretores').select('nome,whatsapp').ilike('regiao', `%${data.neighborhood}%`).eq('ativo', true).limit(1).single();
      if (r.data) corretor = r.data;
    }
    const html = renderImovel(data, corretor);
    imovelCache.set(id, { html, time: Date.now() });
    res.send(html);
  } catch (e) {
    // Return cached version if available (even if expired)
    if (cached) return res.send(cached.html);
    res.status(500).send('<h1>Erro temporário</h1><p>Tente novamente em alguns minutos.</p>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Só Casa Top API rodando na porta ${PORT}`);
  console.log(`   Webhook: http://localhost:${PORT}/webhook/whatsapp`);
  console.log(`   Imóveis: http://localhost:${PORT}/api/imoveis`);
});
