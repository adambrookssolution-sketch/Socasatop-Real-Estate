const supabase = require('../config/supabase');

async function listar(req, res) {
  const { data, error } = await supabase
    .from('corretores')
    .select('*')
    .eq('ativo', true)
    .order('nome');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function detalhe(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('corretores')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Corretor não encontrado' });
  res.json(data);
}

async function criar(req, res) {
  const { nome, whatsapp, email, regiao } = req.body;
  if (!nome || !whatsapp) {
    return res.status(400).json({ error: 'nome e whatsapp são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('corretores')
    .insert({ nome, whatsapp, email, regiao, ativo: true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('corretores')
    .update(req.body)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

module.exports = { listar, detalhe, criar, atualizar };
