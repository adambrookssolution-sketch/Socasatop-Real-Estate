const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

process.on('uncaughtException', (err) => { console.error('UNCAUGHT:', err.message, err.stack); });
process.on('unhandledRejection', (err) => { console.error('UNHANDLED:', err.message || err, err.stack || ''); });

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', project: 'So Casa Top API', version: '1.1.0' });
});

// Webhooks
app.use('/webhook/whatsapp', require('./routes/whatsapp'));
app.use('/webhook/instagram', require('./routes/instagram'));

// Core APIs
app.use('/api/imoveis', require('./routes/imoveis'));
app.use('/api/corretores', require('./routes/corretores'));
app.use('/api/imobiliarias', require('./routes/imobiliarias'));
app.use('/api/gestores', require('./routes/gestores'));
app.use('/api/import', require('./routes/import'));
app.use('/api/curadoria', require('./routes/curadoria'));
app.use('/api/creditos', require('./routes/creditos'));
app.use('/api/regioes', require('./routes/regioes'));
app.use('/api/parceiros', require('./routes/parceiros'));
app.use('/webhook', require('./routes/webhooks_pagamentos'));

const landingView = require('./views/landing');
app.get('/parceiros', (req, res) => res.send(landingView.render()));
app.get('/seja-parceiro', (req, res) => res.send(landingView.render()));

// Galeria (token-based management UI)
const galeriaRoutes = require('./routes/galeria');
app.use('/api/galeria', galeriaRoutes.apiRouter);
app.use('/galeria', galeriaRoutes.pageRouter);

// Pagina visual do imovel
const { renderImovel } = require('./views/imovel');
const supabaseView = require('./config/supabase');
const imovelCache = new Map();
const IMOVEL_CACHE_TTL = 60 * 1000;

function invalidateImovelCache(id) {
  if (id === undefined || id === null) {
    imovelCache.clear();
    return;
  }
  imovelCache.delete(String(id));
}
app.locals.invalidateImovelCache = invalidateImovelCache;

app.post('/api/_cache/invalidate', (req, res) => {
  invalidateImovelCache();
  res.json({ success: true });
});
app.post('/api/_cache/invalidate/:id', (req, res) => {
  invalidateImovelCache(req.params.id);
  res.json({ success: true });
});

app.get('/imovel/:id', async (req, res) => {
  const id = req.params.id;

  const cached = imovelCache.get(id);
  if (cached && Date.now() - cached.time < IMOVEL_CACHE_TTL) {
    return res.send(cached.html);
  }

  try {
    const { data, error } = await supabaseView.from('imoveis').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).send('<h1>Imovel nao encontrado</h1>');

    const REG_BLOQ = ['guara','guará','taguatinga','sobradinho','planaltina','samambaia','ceilandia','ceilândia','recanto das emas','gama','santa maria','riacho fundo'];
    const nb = (data.neighborhood || '').toLowerCase().trim();
    const isBloqueado = REG_BLOQ.some(b => nb === b || nb.startsWith(b + ' ') || nb.endsWith(' ' + b));

    if (data.ativo === false || data.visibility === 'oculto' || (data.status && !['publicado', 'vinculado'].includes(data.status)) || isBloqueado) {
      imovelCache.delete(id);
      return res.status(404).send('<h1>Imovel nao disponivel</h1>');
    }

    let corretor = null;
    if (data.corretor_id) {
      const r = await supabaseView.from('corretores').select('nome,whatsapp').eq('id', data.corretor_id).single();
      if (r.data) corretor = r.data;
    }
    if (!corretor && data.neighborhood) {
      const r = await supabaseView.from('corretores').select('nome,whatsapp').ilike('regiao', `%${data.neighborhood}%`).eq('ativo', true).limit(1).single();
      if (r.data) corretor = r.data;
    }
    const html = renderImovel(data, corretor);
    imovelCache.set(id, { html, time: Date.now() });
    res.send(html);
  } catch (e) {
    if (cached) return res.send(cached.html);
    res.status(500).send('<h1>Erro temporario</h1><p>Tente novamente em alguns minutos.</p>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`So Casa Top API rodando na porta ${PORT}`);
  console.log(`Webhook: http://localhost:${PORT}/webhook/whatsapp`);
  console.log(`Imoveis: http://localhost:${PORT}/api/imoveis`);
  console.log(`Galeria: http://localhost:${PORT}/galeria/:token`);
});
