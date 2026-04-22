const supabase = require('../config/supabase');

async function list(req, res) {
  try {
    const { data, error } = await supabase
      .from('gestores')
      .select('*, imobiliarias(id, nome)')
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function create(req, res) {
  try {
    const { nome, whatsapp, email, imobiliaria_id } = req.body;
    if (!nome || !whatsapp) {
      return res.status(400).json({ error: 'nome e whatsapp obrigatorios' });
    }
    const cleanPhone = whatsapp.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('gestores')
      .insert({ nome, whatsapp: cleanPhone, email, imobiliaria_id })
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
    if (updates.whatsapp) updates.whatsapp = updates.whatsapp.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('gestores')
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
      .from('gestores')
      .update({ ativo: false })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createFromData(payload) {
  if (payload.whatsapp) {
    payload.whatsapp = payload.whatsapp.replace(/\D/g, '');
  }
  const { data, error } = await supabase
    .from('gestores')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = { list, create, update, remove, createFromData };
