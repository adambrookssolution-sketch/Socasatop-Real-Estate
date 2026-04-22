const supabase = require('../config/supabase');

async function listar(req, res) {
  const { offer_type, property_type, location, bedrooms, min_price, max_price, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('imoveis')
    .select('*', { count: 'exact' })
    .eq('ativo', true)
    .range(offset, offset + limit - 1)
    .order('amount', { ascending: true });

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

  res.json({ total: count, page: parseInt(page), data });
}

async function detalhe(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('imoveis')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Imóvel não encontrado' });
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
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (updates.details && typeof updates.details === 'object') {
    updates.details = JSON.stringify(updates.details);
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('imoveis')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
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
  res.json({ message: 'Imóvel marcado como vendido', data });
}

async function deletar(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('imoveis')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Imóvel removido' });
}

module.exports = { listar, detalhe, criar, atualizar, marcarVendido, deletar };
