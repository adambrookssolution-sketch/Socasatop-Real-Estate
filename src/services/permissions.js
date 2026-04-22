const supabase = require('../config/supabase');

const ADM_PHONES = (process.env.ADM_PHONE || '556181288923')
  .split(',')
  .map(p => p.trim().replace(/\D/g, ''))
  .filter(Boolean);

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

function isADM(phone) {
  const clean = normalizePhone(phone);
  return ADM_PHONES.some(adm => clean === adm || adm.endsWith(clean) || clean.endsWith(adm));
}

async function getGestor(phone) {
  const clean = normalizePhone(phone);
  if (!clean) return null;
  try {
    const { data, error } = await supabase
      .from('gestores')
      .select('id, nome, whatsapp, imobiliaria_id, ativo')
      .eq('ativo', true);
    if (error || !data) return null;
    const match = data.find(g => {
      const gPhone = normalizePhone(g.whatsapp);
      return gPhone === clean || gPhone.endsWith(clean) || clean.endsWith(gPhone);
    });
    return match || null;
  } catch (e) {
    return null;
  }
}

async function getCorretor(phone) {
  const clean = normalizePhone(phone);
  if (!clean) return null;
  try {
    const { data, error } = await supabase
      .from('corretores')
      .select('id, nome, whatsapp, imobiliaria_id, autonomo, ativo')
      .eq('ativo', true);
    if (error || !data) return null;
    const match = data.find(c => {
      const cPhone = normalizePhone(c.whatsapp);
      return cPhone === clean || cPhone.endsWith(clean) || clean.endsWith(cPhone);
    });
    return match || null;
  } catch (e) {
    return null;
  }
}

async function getRole(phone) {
  if (isADM(phone)) return { role: 'adm', entity: null };
  const gestor = await getGestor(phone);
  if (gestor) return { role: 'gestor', entity: gestor };
  const corretor = await getCorretor(phone);
  if (corretor) return { role: 'corretor', entity: corretor };
  return { role: 'lead', entity: null };
}

async function canManageImovel(phone, imovelId) {
  if (isADM(phone)) return true;
  try {
    const { data: imovel } = await supabase
      .from('imoveis')
      .select('corretor_id, imobiliaria_id')
      .eq('id', imovelId)
      .single();
    if (!imovel) return false;

    const gestor = await getGestor(phone);
    if (gestor && gestor.imobiliaria_id && gestor.imobiliaria_id === imovel.imobiliaria_id) {
      return true;
    }

    const corretor = await getCorretor(phone);
    if (corretor && corretor.id === imovel.corretor_id) return true;

    return false;
  } catch (e) {
    return false;
  }
}

module.exports = {
  normalizePhone,
  isADM,
  getGestor,
  getCorretor,
  getRole,
  canManageImovel,
  ADM_PHONES,
};
