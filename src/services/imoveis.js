const supabase = require('../config/supabase');

async function buscarImoveis({ offer_type, property_type, location, bedrooms, min_budget, max_budget, limit = 3 }) {
  let query = supabase
    .from('imoveis')
    .select('id, titulo, offer_type, property_type, amount, bedrooms, size, neighborhood, location, images, condominium, financing')
    .eq('ativo', true)
    .limit(limit);

  if (offer_type) {
    const val = offer_type.toLowerCase().includes('alug') ? 'aluguel' : 'compra';
    query = query.ilike('offer_type', `%${val}%`);
  }

  if (property_type) {
    query = query.ilike('property_type', `%${property_type}%`);
  }

  if (location) {
    query = query.or(`location.ilike.%${location}%,neighborhood.ilike.%${location}%`);
  }

  if (bedrooms) {
    query = query.eq('bedrooms', bedrooms);
  }

  if (min_budget) {
    query = query.gte('amount', min_budget);
  }

  if (max_budget) {
    query = query.lte('amount', max_budget);
  }

  // Fetch more to sort by proximity to budget, then trim to limit
  const fetchLimit = max_budget ? Math.max(limit * 5, 20) : limit;
  query = query.order('amount', { ascending: false }).limit(fetchLimit);

  try {
    const result = await query;
    if (result.data && result.data.length > 0) {
      let data = result.data;
      // Mix above and below budget: pick from both sides
      if (max_budget && min_budget) {
        const target = Math.round((Number(min_budget) + Number(max_budget)) / 2);
        const above = data.filter(p => Number(p.amount) > target).sort((a,b) => Number(a.amount) - Number(b.amount));
        const atOrBelow = data.filter(p => Number(p.amount) <= target).sort((a,b) => Number(b.amount) - Number(a.amount));
        // Mix: alternate above/below, starting with above (client prefers to see higher value)
        const mixed = [];
        let ai = 0, bi = 0;
        // Pattern: above, below, above (2 above + 1 below when limit=3)
        while (mixed.length < limit && (ai < above.length || bi < atOrBelow.length)) {
          if (ai < above.length) mixed.push(above[ai++]);
          if (mixed.length >= limit) break;
          if (bi < atOrBelow.length) mixed.push(atOrBelow[bi++]);
          if (mixed.length >= limit) break;
          if (ai < above.length) mixed.push(above[ai++]);
          if (mixed.length >= limit) break;
        }
        // If not enough from one side, fill from the other
        while (mixed.length < limit && ai < above.length) mixed.push(above[ai++]);
        while (mixed.length < limit && bi < atOrBelow.length) mixed.push(atOrBelow[bi++]);
        return mixed.slice(0, limit);
      }
      return data.slice(0, limit);
    }
  } catch (e) {
    console.log('Supabase query error:', e.message);
  }

  return [];
}

function formatImovelCard(imovel) {
  const preco = imovel.amount
    ? `R$ ${Number(imovel.amount).toLocaleString('pt-BR')}`
    : 'Consulte';
  const quartos = imovel.bedrooms ? ` ${imovel.bedrooms} quartos` : '';
  const area = imovel.size ? ` ${imovel.size}m²` : '';
  const local = imovel.neighborhood || imovel.location || '';
  const cond = imovel.condominium ? ' Condomínio' : '';
  const fin = imovel.financing ? ' Aceita financiamento' : '';

  let card = ` *${imovel.titulo}*`;
  if (local) card += `\n ${local}`;
  card += `\n ${preco}`;
  if (quartos) card += `\n${quartos}`;
  if (area) card += ` | ${area}`;
  if (cond) card += `\n${cond}`;
  if (fin) card += `\n${fin}`;
  const baseUrl = process.env.BASE_URL || 'https://socasatop.com.br';
  card += `\n\n Ver detalhes: ${baseUrl}/imovel/${imovel.id}`;

  return card;
}

module.exports = { buscarImoveis, formatImovelCard };
