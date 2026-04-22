const supabase = require('../config/supabase');

async function list(req, res) {
  try {
    const { data, error } = await supabase
      .from('imobiliarias')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function get(req, res) {
  try {
    const { data, error } = await supabase
      .from('imobiliarias')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

async function create(req, res) {
  try {
    const { nome, cnpj, responsavel, whatsapp_gestor, site, regras_comerciais } = req.body;
    if (!nome) return res.status(400).json({ error: 'nome obrigatorio' });
    const { data, error } = await supabase
      .from('imobiliarias')
      .insert({ nome, cnpj, responsavel, whatsapp_gestor, site, regras_comerciais })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function update(req, res) {
  try {
    const updates = req.body;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('imobiliarias')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function remove(req, res) {
  try {
    const { error } = await supabase
      .from('imobiliarias')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createFromData(payload) {
  const { data, error } = await supabase
    .from('imobiliarias')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function findByCNPJ(cnpj) {
  if (!cnpj) return null;
  const clean = cnpj.replace(/\D/g, '');
  const { data } = await supabase
    .from('imobiliarias')
    .select('*')
    .eq('cnpj', clean)
    .maybeSingle();
  return data || null;
}

module.exports = { list, get, create, update, remove, createFromData, findByCNPJ };
