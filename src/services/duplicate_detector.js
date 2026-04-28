const supabase = require('../config/supabase');

function normalizeText(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractQuadra(text) {
  if (!text) return null;
  const t = normalizeText(text);
  const patterns = [
    /\b(qi|ql|qd|quadra|qe|qn|sq|sh|smdb|smpw|shis|shin|shis qi|shis ql|shin ql)\s*0*(\d{1,3})\b/i,
    /\b(conj|conjunto|cj)\s*0*(\d{1,3})\b/i,
    /\b(rua|r)\s*0*(\d{1,3})[a-z]?\b/i,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return (m[1] + m[2]).replace(/\s+/g, '');
  }
  return null;
}

function neighborhoodKey(neighborhood) {
  return normalizeText(neighborhood).replace(/\s+/g, '');
}

function buildSearchKey(imovel) {
  const parts = [];
  const nb = neighborhoodKey(imovel.neighborhood || imovel.location || '');
  if (nb) parts.push(nb);
  const quadra = extractQuadra(imovel.street || imovel.titulo || imovel.location || '');
  if (quadra) parts.push(quadra);
  return parts.join(':');
}

function precoSimilar(a, b, tolerance) {
  if (!a || !b) return false;
  const tol = tolerance != null ? tolerance : 0.05;
  const diff = Math.abs(Number(a) - Number(b)) / Math.max(Number(a), Number(b));
  return diff <= tol;
}

function areaSimilar(a, b, tolerance) {
  if (!a || !b) return false;
  const tol = tolerance != null ? tolerance : 0.10;
  const diff = Math.abs(Number(a) - Number(b)) / Math.max(Number(a), Number(b));
  return diff <= tol;
}

async function findPotentialDuplicates(imovel, excludeId) {
  const candidates = new Map();

  if (imovel.source_url) {
    const { data } = await supabase
      .from('imoveis')
      .select('id, titulo, neighborhood, street, location, amount, size, bedrooms, corretor_id, imobiliaria_id, source_url, created_at, ativo')
      .eq('source_url', imovel.source_url)
      .eq('ativo', true);
    for (const c of data || []) {
      if (c.id === excludeId) continue;
      candidates.set(c.id, { imovel: c, score: 1.0, reason: 'mesma URL de origem' });
    }
  }

  const nbKey = neighborhoodKey(imovel.neighborhood || imovel.location || '');
  const quadra = extractQuadra(imovel.street || imovel.titulo || imovel.location || '');

  if (nbKey && quadra) {
    const { data } = await supabase
      .from('imoveis')
      .select('id, titulo, neighborhood, street, location, amount, size, bedrooms, corretor_id, imobiliaria_id, source_url, created_at, ativo')
      .ilike('neighborhood', '%' + (imovel.neighborhood || '').substring(0, 20) + '%')
      .eq('ativo', true)
      .limit(100);

    for (const c of data || []) {
      if (c.id === excludeId) continue;
      if (candidates.has(c.id)) continue;

      const cQuadra = extractQuadra(c.street || c.titulo || c.location || '');
      const cNbKey = neighborhoodKey(c.neighborhood || c.location || '');

      if (nbKey !== cNbKey) continue;
      if (!cQuadra || quadra !== cQuadra) continue;

      let score = 0.5;
      const reasons = ['mesma quadra (' + quadra + ') + mesmo bairro'];

      if (imovel.bedrooms && c.bedrooms && imovel.bedrooms === c.bedrooms) {
        score += 0.2;
        reasons.push(imovel.bedrooms + ' quartos iguais');
      }
      if (areaSimilar(imovel.size, c.size)) {
        score += 0.15;
        reasons.push('area similar');
      }
      if (precoSimilar(imovel.amount, c.amount)) {
        score += 0.1;
        reasons.push('preco similar');
      }

      if (score >= 0.7) {
        candidates.set(c.id, { imovel: c, score, reason: reasons.join(', ') });
      }
    }
  }

  return Array.from(candidates.values()).sort((a, b) => b.score - a.score);
}

async function checkBeforeInsert(imovel) {
  const matches = await findPotentialDuplicates(imovel);
  if (matches.length === 0) return { duplicate: false };

  const top = matches[0];
  return {
    duplicate: true,
    match: top.imovel,
    score: top.score,
    reason: top.reason,
    all_matches: matches.slice(0, 5),
  };
}

module.exports = {
  normalizeText,
  extractQuadra,
  neighborhoodKey,
  buildSearchKey,
  findPotentialDuplicates,
  checkBeforeInsert,
};
