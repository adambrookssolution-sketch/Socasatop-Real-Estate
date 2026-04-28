const supabase = require('../config/supabase');

let _visibilityColumnExists = null;
async function hasVisibilityColumn() {
  if (_visibilityColumnExists !== null) return _visibilityColumnExists;
  try {
    const { error } = await supabase.from('imoveis').select('visibility').limit(1);
    _visibilityColumnExists = !error;
  } catch (e) {
    _visibilityColumnExists = false;
  }
  return _visibilityColumnExists;
}

const REGIOES_BLOQUEADAS = ['guara', 'guará', 'taguatinga', 'sobradinho', 'planaltina', 'samambaia', 'ceilandia', 'ceilândia', 'recanto das emas', 'gama', 'santa maria', 'riacho fundo'];

function regiaoBloqueada(neighborhood) {
  if (!neighborhood) return false;
  const n = neighborhood.toLowerCase().trim();
  return REGIOES_BLOQUEADAS.some(b => n === b || n.startsWith(b + ' ') || n.endsWith(' ' + b));
}

const LIST_COLUMNS = 'id,titulo,offer_type,property_type,amount,bedrooms,size,neighborhood,location,street,images,status,visibility,ativo,created_at,imobiliaria_id,corretor_id';

const _listCache = new Map();
const LIST_CACHE_TTL_MS = 60 * 1000;

function cacheGet(key) {
  const e = _listCache.get(key);
  if (!e) return null;
  if (Date.now() - e.t > LIST_CACHE_TTL_MS) { _listCache.delete(key); return null; }
  return e.v;
}
function cacheSet(key, v) {
  _listCache.set(key, { t: Date.now(), v });
  if (_listCache.size > 200) {
    const first = _listCache.keys().next().value;
    _listCache.delete(first);
  }
}
function cacheInvalidate() { _listCache.clear(); }

async function listar(req, res) {
  const { offer_type, property_type, location, bedrooms, min_price, max_price, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * parseInt(limit);

  const cacheKey = JSON.stringify({ offer_type, property_type, location, bedrooms, min_price, max_price, page, limit });
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  let query = supabase
    .from('imoveis')
    .select(LIST_COLUMNS, { count: 'estimated' })
    .eq('ativo', true)
    .eq('regiao_bloqueada', false)
    .range(offset, offset + parseInt(limit) - 1)
    .order('amount', { ascending: true });

  if (await hasVisibilityColumn()) {
    query = query.or('visibility.is.null,visibility.eq.explicito');
    query = query.or('status.is.null,status.eq.publicado,status.eq.vinculado');
  }

  if (offer_type) {
    const ot = offer_type.toLowerCase();
    const val = (ot.includes('vend') || ot.includes('compr')) ? 'compra' : 'aluguel';
    query = query.ilike('offer_type', `%${val}%`);
  }
  if (property_type) query = query.ilike('property_type', `%${property_type}%`);
  if (location) query = query.or(`location.ilike.%${location}%,neighborhood.ilike.%${location}%`);
  if (bedrooms) query = query.eq('bedrooms', parseInt(bedrooms));
  if (min_price) query = query.gte('amount', parseFloat(min_price));
  if (max_price) query = query.lte('amount', parseFloat(max_price));

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const payload = { total: count, page: parseInt(page), data: data || [] };
  cacheSet(cacheKey, payload);
  res.json(payload);
}

async function detalhe(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('imoveis')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Imóvel não encontrado' });
  if (regiaoBloqueada(data.neighborhood)) return res.status(404).json({ error: 'Imóvel não disponível' });
  res.json(data);
}

async function criar(req, res) {
  const {
    titulo, offer_type, property_type, amount, bedrooms, size,
    condominium, financing, street, neighborhood, location,
    details, images, corretor_id
  } = req.body;

  if (!titulo || !offer_type || !property_type) {
    return res.status(400).json({ error: 'titulo, offer_type e property_type são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('imoveis')
    .insert({
      titulo, offer_type, property_type, amount, bedrooms, size,
      condominium: condominium || false,
      financing: financing || false,
      street, neighborhood, location,
      details: details ? JSON.stringify(details) : null,
      images: images || [],
      corretor_id,
      ativo: true,
      regiao_bloqueada: regiaoBloqueada(neighborhood),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  cacheInvalidate();
  res.status(201).json(data);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (updates.details && typeof updates.details === 'object') {
    updates.details = JSON.stringify(updates.details);
  }
  if (updates.neighborhood !== undefined) {
    updates.regiao_bloqueada = regiaoBloqueada(updates.neighborhood);
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('imoveis')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  cacheInvalidate();
  res.json(data);
}

async function marcarVendido(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('imoveis')
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  cacheInvalidate();
  res.json({ message: 'Imóvel marcado como vendido', data });
}

async function deletar(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('imoveis')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  cacheInvalidate();
  res.json({ message: 'Imóvel removido' });
}

module.exports = { listar, detalhe, criar, atualizar, marcarVendido, deletar, cacheInvalidate };
