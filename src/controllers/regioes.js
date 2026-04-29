const supabase = require('../config/supabase');

async function listar(req, res) {
  try {
    const { data, error } = await supabase
      .from('regioes')
      .select('*')
      .eq('ativo', true)
      .order('ordem');
    if (error) throw error;

    const enriched = (data || []).map(r => ({
      ...r,
      vagas_disponiveis: Math.max(0, (r.vagas_total || 0) - (r.vagas_ocupadas || 0)),
      esgotado: (r.vagas_ocupadas || 0) >= (r.vagas_total || 0),
    }));
    res.json({ data: enriched });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getBySlug(req, res) {
  try {
    const { data, error } = await supabase
      .from('regioes')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('ativo', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'regiao nao encontrada' });
    res.json({
      data: {
        ...data,
        vagas_disponiveis: Math.max(0, (data.vagas_total || 0) - (data.vagas_ocupadas || 0)),
        esgotado: (data.vagas_ocupadas || 0) >= (data.vagas_total || 0),
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function recontar(req, res) {
  try {
    const { data: regs } = await supabase.from('regioes').select('id, vagas_seed, vagas_total');
    let total = 0;
    for (const r of regs || []) {
      const { count } = await supabase
        .from('parceiros')
        .select('*', { count: 'exact', head: true })
        .eq('regiao_id', r.id)
        .in('status', ['reservado', 'ocupado']);
      const seed = r.vagas_seed || 0;
      const max = r.vagas_total || 0;
      const ocupadas = Math.min(max, (count || 0) + seed);
      await supabase.from('regioes').update({ vagas_ocupadas: ocupadas }).eq('id', r.id);
      total++;
    }
    res.json({ atualizadas: total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function ajustarVagas(req, res) {
  try {
    const { vagas_total, ativo } = req.body;
    const updates = {};
    if (vagas_total != null) updates.vagas_total = parseInt(vagas_total);
    if (ativo != null) updates.ativo = !!ativo;
    const { data, error } = await supabase
      .from('regioes')
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

module.exports = { listar, getBySlug, recontar, ajustarVagas };
