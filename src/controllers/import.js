const supabase = require('../config/supabase');
const scraper = require('../services/scraper');
const duplicateDetector = require('../services/duplicate_detector');

const MIN_PRICE = Number(process.env.MIN_PRICE || 1500000);

async function importFromUrl(url, importedByPhone, opts) {
  const captadoPor = (opts && opts.captadoPor) === 'socasatop' ? 'socasatop' : 'parceiro';
  let parceiroAtribuidoId = (opts && opts.parceiroAtribuidoId) ? parseInt(opts.parceiroAtribuidoId) : null;

  // Auto-assign for tipo=corretor parceiros: if importedByPhone matches an active corretor parceiro,
  // attribute the imoveis to him (cenario B). For imobiliaria, no auto-assign (gestor decides).
  if (!parceiroAtribuidoId && importedByPhone) {
    try {
      const cleanPhone = String(importedByPhone).replace(/\D/g, '');
      const { data: parc } = await supabase
        .from('parceiros')
        .select('id, tipo_parceiro, status')
        .eq('whatsapp', cleanPhone)
        .in('status', ['reservado', 'ocupado'])
        .maybeSingle();
      if (parc && parc.tipo_parceiro === 'corretor') {
        parceiroAtribuidoId = parc.id;
      }
    } catch (e) { /* ignore */ }
  }

  let result;
  try {
    result = await scraper.scrapeUrl(url);
  } catch (e) {
    return { success: false, imported: 0, duplicates: 0, errors: 1, below_min: 0, message: 'Erro ao acessar a pagina: ' + e.message };
  }

  if (!result.properties || result.properties.length === 0) {
    let msg = 'Nenhum imovel encontrado nesta pagina.';
    if (result.type === 'listing') {
      msg += '\n\nA pagina parece ser de listagem mas usa JavaScript para carregar os imoveis (SPA). ';
      msg += 'Tente enviar a URL de um imovel especifico (pagina de detalhe).';
    } else if (result.type === 'unknown') {
      msg += '\n\nO site pode estar bloqueando scraping (Cloudflare) ou nao ter conteudo legivel. ';
      msg += 'Tente a URL de um anuncio individual.';
    }
    return { success: false, imported: 0, duplicates: 0, errors: 0, below_min: 0, message: msg };
  }

  let imported = 0;
  let duplicates = 0;
  let errors = 0;
  let belowMin = 0;
  let duplicatesByMatch = 0;
  const importedIds = [];
  const duplicateMatches = [];

  for (const prop of result.properties) {
    try {
      const priceNum = prop.preco != null ? Number(prop.preco) : null;
      const isAluguel = prop.offer_type && /alug/i.test(prop.offer_type);
      if (!isAluguel && priceNum != null && priceNum > 0 && priceNum < MIN_PRICE) {
        belowMin++;
        continue;
      }

      if (prop.source_url) {
        const { data: existing } = await supabase
          .from('imoveis')
          .select('id')
          .eq('source_url', prop.source_url)
          .maybeSingle();
        if (existing) {
          duplicates++;
          continue;
        }
      }

      const propForCheck = {
        titulo: prop.titulo,
        neighborhood: prop.neighborhood,
        location: prop.location,
        street: prop.street,
        amount: prop.preco,
        size: prop.size,
        bedrooms: prop.bedrooms,
      };
      try {
        const dupCheck = await duplicateDetector.checkBeforeInsert(propForCheck);
        if (dupCheck.duplicate && dupCheck.score >= 0.75) {
          duplicatesByMatch++;
          duplicateMatches.push({
            tentativa: prop.titulo || prop.source_url,
            ja_existe: dupCheck.match.titulo + ' (ID ' + dupCheck.match.id + ')',
            motivo: dupCheck.reason,
            score: dupCheck.score,
          });
          continue;
        }
      } catch (e) { /* if detector fails, allow insert */ }

      const subDir = 'imp_' + Date.now();
      const savedImages = await scraper.saveImagesForProperty(prop, subDir);

      const payload = {
        titulo: prop.titulo || 'Imovel importado',
        details: prop.descricao || null,
        amount: prop.preco || null,
        offer_type: prop.offer_type || 'compra',
        property_type: prop.property_type || 'Casa',
        bedrooms: prop.bedrooms || null,
        size: prop.size || null,
        neighborhood: prop.neighborhood || null,
        location: prop.location || null,
        street: prop.street || null,
        images: savedImages,
        source_url: prop.source_url || url,
        imported_at: new Date().toISOString(),
        imported_by_phone: importedByPhone || null,
        status: 'rascunho',
        visibility: 'explicito',
        ativo: true,
        captado_por: captadoPor,
        parceiro_atribuido_id: parceiroAtribuidoId,
        atribuido_em: parceiroAtribuidoId ? new Date().toISOString() : null,
      };

      const { data: inserted, error } = await supabase
        .from('imoveis')
        .insert(payload)
        .select('id, titulo')
        .single();

      if (error) {
        errors++;
        continue;
      }

      imported++;
      importedIds.push(inserted.id);
    } catch (e) {
      errors++;
    }
  }

  return {
    success: true,
    imported,
    duplicates,
    duplicates_by_match: duplicatesByMatch,
    duplicate_matches: duplicateMatches,
    errors,
    below_min: belowMin,
    min_price: MIN_PRICE,
    total: result.properties.length,
    type: result.type,
    ids: importedIds,
  };
}

async function listPending(filter = {}) {
  let query = supabase
    .from('imoveis')
    .select('id, titulo, amount, neighborhood, property_type, status, imported_at, imported_by_phone')
    .eq('status', 'rascunho')
    .eq('ativo', true)
    .order('imported_at', { ascending: false });

  if (filter.imported_by_phone) {
    query = query.eq('imported_by_phone', filter.imported_by_phone);
  }
  if (filter.imobiliaria_id) {
    query = query.eq('imobiliaria_id', filter.imobiliaria_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function approveImovel(id) {
  const { data, error } = await supabase
    .from('imoveis')
    .update({ status: 'publicado' })
    .eq('id', id)
    .select('id, titulo')
    .single();
  if (error) throw error;
  return data;
}

async function rejectImovel(id) {
  const { error } = await supabase
    .from('imoveis')
    .update({ status: 'inativo', ativo: false })
    .eq('id', id);
  if (error) throw error;
  return { id, rejected: true };
}

async function handleImportEndpoint(req, res) {
  try {
    const { url, phone } = req.body;
    if (!url) return res.status(400).json({ error: 'url obrigatoria' });
    const result = await importFromUrl(url, phone);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  importFromUrl,
  listPending,
  approveImovel,
  rejectImovel,
  handleImportEndpoint,
};
