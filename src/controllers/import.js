const supabase = require('../config/supabase');
const scraper = require('../services/scraper');

async function importFromUrl(url, importedByPhone) {
  const result = await scraper.scrapeUrl(url);

  if (!result.properties || result.properties.length === 0) {
    return { success: false, imported: 0, duplicates: 0, errors: 0, message: 'Nenhum imovel encontrado na pagina.' };
  }

  let imported = 0;
  let duplicates = 0;
  let errors = 0;
  const importedIds = [];

  for (const prop of result.properties) {
    try {
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
    errors,
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
