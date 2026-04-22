const supabase = require('../config/supabase');

async function upsertLead({ whatsapp, nome, offer_type, bedrooms, budget, location }) {
  const row = { whatsapp, status: 'novo' };
  if (nome) row.nome = nome;
  if (offer_type) row.offer_type = offer_type;
  if (bedrooms) row.bedrooms = bedrooms;
  if (budget) row.budget_max = budget;
  if (location) row.regiao = location;

  const { data, error } = await supabase
    .from('leads')
    .upsert(row, { onConflict: 'whatsapp' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function salvarInteracao({ lead_id, canal, direcao, mensagem }) {
  const { error } = await supabase
    .from('interacoes')
    .insert({ lead_id, canal: canal || 'whatsapp', direcao, mensagem });

  if (error) throw error;
}

async function buscarLead(whatsapp) {
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('whatsapp', whatsapp)
    .single();
  return data;
}

async function buscarPorWhatsapp(identifier) {
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('whatsapp', identifier)
    .single();
  return data;
}

async function criarLead({ whatsapp, canal, status, nome }) {
  const { data, error } = await supabase
    .from('leads')
    .insert({ whatsapp, canal: canal || 'whatsapp', status: status || 'novo', nome })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getHistorico(leadId, limit = 10) {
  const { data } = await supabase
    .from('interacoes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).reverse();
}

async function atualizarLead(id, updates) {
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = { upsertLead, salvarInteracao, buscarLead, buscarPorWhatsapp, criarLead, getHistorico, atualizarLead };
