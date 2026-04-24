const supabase = require('../config/supabase');
const tokenUtil = require('../utils/token');
const galeriaView = require('../views/galeria');

async function renderPage(req, res) {
  const token = req.params.token;
  const session = await tokenUtil.validateSessionToken(token);
  if (!session) {
    return res.status(403).send('<h1>Link expirado ou invalido</h1><p>Solicite um novo link pelo WhatsApp.</p>');
  }
  const html = galeriaView.render(session);
  res.send(html);
}

async function listImoveis(req, res) {
  try {
    const session = await tokenUtil.validateSessionToken(req.params.token);
    if (!session) return res.status(403).json({ error: 'sessao invalida' });

    const status = req.query.status || 'all';
    let query = supabase
      .from('imoveis')
      .select('id, titulo, amount, neighborhood, location, property_type, bedrooms, size, images, status, visibility, publish_site, publish_instagram, publish_campanhas, publish_atendimento_privado, corretor_id, imobiliaria_id, source_url, curadoria_requested')
      .eq('ativo', true)
      .order('id', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (session.role === 'gestor' && session.imobiliaria_id) {
      query = query.eq('imobiliaria_id', session.imobiliaria_id);
    }

    const { data, error } = await query.limit(500);
    if (error) throw error;

    const { data: corretores } = await supabase
      .from('corretores')
      .select('id, nome, whatsapp, imobiliaria_id, autonomo')
      .eq('ativo', true)
      .order('nome');

    let filteredCorretores = corretores || [];
    if (session.role === 'gestor' && session.imobiliaria_id) {
      filteredCorretores = filteredCorretores.filter(c => c.imobiliaria_id === session.imobiliaria_id);
    }

    res.json({ imoveis: data || [], corretores: filteredCorretores, session: { role: session.role, imobiliaria_id: session.imobiliaria_id } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function batchAction(req, res) {
  try {
    const session = await tokenUtil.validateSessionToken(req.params.token);
    if (!session) return res.status(403).json({ error: 'sessao invalida' });

    const { imovel_ids, action, payload } = req.body;
    if (!Array.isArray(imovel_ids) || imovel_ids.length === 0) {
      return res.status(400).json({ error: 'imovel_ids obrigatorio' });
    }

    let updates = {};

    switch (action) {
      case 'vincular':
        if (!payload || !payload.corretor_id) return res.status(400).json({ error: 'corretor_id obrigatorio' });
        updates.corretor_id = payload.corretor_id;
        if (payload.imobiliaria_id != null) updates.imobiliaria_id = payload.imobiliaria_id;
        if (session.role !== 'adm') {
          const { data: corr } = await supabase.from('corretores').select('imobiliaria_id, autonomo').eq('id', payload.corretor_id).single();
          if (!corr) return res.status(400).json({ error: 'corretor invalido' });
          if (session.imobiliaria_id && corr.imobiliaria_id !== session.imobiliaria_id) {
            return res.status(403).json({ error: 'corretor nao pertence a sua imobiliaria' });
          }
        }
        if (updates.imobiliaria_id == null) {
          const { data: corr } = await supabase.from('corretores').select('imobiliaria_id').eq('id', payload.corretor_id).single();
          if (corr) updates.imobiliaria_id = corr.imobiliaria_id || null;
        }
        if (updates.corretor_id) {
          updates.status = 'vinculado';
        }
        break;

      case 'visibility':
        if (!['explicito', 'oculto'].includes(payload && payload.visibility)) {
          return res.status(400).json({ error: 'visibility invalida' });
        }
        updates.visibility = payload.visibility;
        break;

      case 'canais':
        if (!payload || typeof payload.canais !== 'object') return res.status(400).json({ error: 'canais obrigatorio' });
        if (typeof payload.canais.site === 'boolean') updates.publish_site = payload.canais.site;
        if (typeof payload.canais.instagram === 'boolean') updates.publish_instagram = payload.canais.instagram;
        if (typeof payload.canais.campanhas === 'boolean') updates.publish_campanhas = payload.canais.campanhas;
        if (typeof payload.canais.atendimento_privado === 'boolean') updates.publish_atendimento_privado = payload.canais.atendimento_privado;
        break;

      case 'publicar':
        updates.status = 'publicado';
        break;

      case 'curadoria':
        updates.curadoria_requested = !!(payload && payload.requested);
        break;

      case 'excluir':
        if (session.role !== 'adm') return res.status(403).json({ error: 'apenas ADM pode excluir' });
        updates.ativo = false;
        updates.status = 'inativo';
        break;

      default:
        return res.status(400).json({ error: 'action invalida' });
    }

    let query = supabase.from('imoveis').update(updates).in('id', imovel_ids);
    if (session.role === 'gestor' && session.imobiliaria_id) {
      query = query.eq('imobiliaria_id', session.imobiliaria_id);
    }
    const { data, error } = await query.select('id');
    if (error) throw error;

    const invalidate = req.app && req.app.locals && req.app.locals.invalidateImovelCache;
    if (invalidate && data) {
      for (const r of data) invalidate(r.id);
    }

    res.json({ success: true, updated: (data || []).length, ids: (data || []).map(r => r.id) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function askCuradoria(req, res) {
  try {
    const session = await tokenUtil.validateSessionToken(req.params.token);
    if (!session) return res.status(403).json({ error: 'sessao invalida' });

    const { imovel_ids, resposta } = req.body;
    if (!Array.isArray(imovel_ids) || imovel_ids.length === 0) {
      return res.status(400).json({ error: 'imovel_ids obrigatorio' });
    }
    const requested = resposta === 'sim';

    const newStatus = requested ? 'aguardando_curadoria' : 'publicado';
    const { error } = await supabase
      .from('imoveis')
      .update({ curadoria_requested: requested, status: newStatus })
      .in('id', imovel_ids);
    if (error) throw error;

    const invalidate = req.app && req.app.locals && req.app.locals.invalidateImovelCache;
    if (invalidate) {
      for (const id of imovel_ids) invalidate(id);
    }

    res.json({ success: true, curadoria_requested: requested });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { renderPage, listImoveis, batchAction, askCuradoria };
