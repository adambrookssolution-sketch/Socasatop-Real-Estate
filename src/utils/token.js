const crypto = require('crypto');
const supabase = require('../config/supabase');

function generateToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

async function createSessionToken({ whatsapp, role, imobiliaria_id, ttlHours = 24 }) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('sessao_galeria')
    .insert({ token, whatsapp, role, imobiliaria_id: imobiliaria_id || null, expires_at: expiresAt })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function validateSessionToken(token) {
  if (!token) return null;
  const { data } = await supabase
    .from('sessao_galeria')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (!data) return null;
  const expires = new Date(data.expires_at).getTime();
  if (expires < Date.now()) return null;
  return data;
}

async function revokeSessionToken(token) {
  await supabase.from('sessao_galeria').delete().eq('token', token);
}

module.exports = { generateToken, createSessionToken, validateSessionToken, revokeSessionToken };
