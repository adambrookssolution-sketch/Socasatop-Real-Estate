const supabase = require('../config/supabase');
const pagbank = require('../services/pagbank');
const clicksign = require('../services/clicksign');

const PLAN_VALOR_CENTAVOS = parseInt(process.env.PARCEIRO_PLANO_CENTAVOS || '49700');
const TRIAL_DIAS = parseInt(process.env.PARCEIRO_TRIAL_DIAS || '21');

function calcularValorCentavos(numRegioes) {
  return PLAN_VALOR_CENTAVOS * Math.max(1, numRegioes);
}

async function logEvento(parceiroId, tipo, payload) {
  try {
    await supabase.from('parceiros_eventos').insert({
      parceiro_id: parceiroId,
      tipo: tipo,
      payload: payload || {},
    });
  } catch (e) { /* log only */ }
}

async function reservarVaga({ regiaoId }) {
  const { data: regiao, error: rErr } = await supabase
    .from('regioes')
    .select('*')
    .eq('id', regiaoId)
    .eq('ativo', true)
    .maybeSingle();
  if (rErr || !regiao) throw new Error('Regiao nao encontrada');
  if ((regiao.vagas_ocupadas || 0) >= (regiao.vagas_total || 0)) {
    throw new Error('Vagas esgotadas para ' + regiao.nome);
  }
  const { count } = await supabase
    .from('parceiros')
    .select('*', { count: 'exact', head: true })
    .eq('regiao_id', regiaoId)
    .in('status', ['reservado', 'ocupado']);
  if ((count || 0) >= (regiao.vagas_total || 0)) {
    throw new Error('Vagas esgotadas para ' + regiao.nome + ' (verificacao em tempo real)');
  }
  return regiao;
}

async function atualizarContadorRegiao(regiaoId) {
  const { count } = await supabase
    .from('parceiros')
    .select('*', { count: 'exact', head: true })
    .eq('regiao_id', regiaoId)
    .in('status', ['reservado', 'ocupado']);
  await supabase.from('regioes').update({ vagas_ocupadas: count || 0 }).eq('id', regiaoId);
}

async function iniciarCadastro(req, res) {
  try {
    const { nome, whatsapp, email, cpf_cnpj, creci, especialidade, regiao_id, regiao_slug, regiao_ids, regiao_slugs, source_landing } = req.body;
    if (!nome || !whatsapp || !email || !cpf_cnpj) {
      return res.status(400).json({ error: 'nome, whatsapp, email e cpf_cnpj obrigatorios' });
    }

    let regiaoIdList = [];
    if (Array.isArray(regiao_ids) && regiao_ids.length > 0) {
      regiaoIdList = regiao_ids.map(x => parseInt(x)).filter(x => x);
    } else if (Array.isArray(regiao_slugs) && regiao_slugs.length > 0) {
      const { data } = await supabase.from('regioes').select('id').in('slug', regiao_slugs);
      regiaoIdList = (data || []).map(r => r.id);
    } else if (regiao_id) {
      regiaoIdList = [parseInt(regiao_id)];
    } else if (regiao_slug) {
      const { data: r } = await supabase.from('regioes').select('id').eq('slug', regiao_slug).maybeSingle();
      if (!r) return res.status(404).json({ error: 'regiao nao encontrada' });
      regiaoIdList = [r.id];
    } else {
      return res.status(400).json({ error: 'pelo menos uma regiao obrigatoria (regiao_id, regiao_slug, regiao_ids ou regiao_slugs)' });
    }

    if (regiaoIdList.length === 0) {
      return res.status(400).json({ error: 'nenhuma regiao valida selecionada' });
    }

    const regioesValidadas = [];
    for (const rid of regiaoIdList) {
      const r = await reservarVaga({ regiaoId: rid });
      regioesValidadas.push(r);
    }

    const cleanWhatsapp = (whatsapp || '').replace(/\D/g, '');
    const cleanCpf = (cpf_cnpj || '').replace(/\D/g, '');

    const { data: existing } = await supabase
      .from('parceiros')
      .select('id, status')
      .eq('whatsapp', cleanWhatsapp)
      .in('status', ['reservado', 'ocupado'])
      .maybeSingle();
    if (existing) return res.status(409).json({ error: 'Ja existe um cadastro ativo para este WhatsApp', parceiro_id: existing.id });

    const regiaoPrincipalId = regioesValidadas[0].id;
    const { data: parceiro, error: pErr } = await supabase
      .from('parceiros')
      .insert({
        nome,
        whatsapp: cleanWhatsapp,
        email,
        cpf_cnpj: cleanCpf,
        creci: creci || null,
        especialidade: especialidade || null,
        regiao_id: regiaoPrincipalId,
        status: 'reservado',
        source_landing: source_landing || 'lp',
        ip_cadastro: req.ip || (req.headers && req.headers['x-forwarded-for']) || null,
        user_agent_cadastro: req.headers && req.headers['user-agent'] || null,
      })
      .select()
      .single();
    if (pErr) throw pErr;

    try {
      const linkRows = regioesValidadas.map(r => ({
        parceiro_id: parceiro.id,
        regiao_id: r.id,
        status: 'reservado',
      }));
      await supabase.from('parceiros_regioes').insert(linkRows);
    } catch (e) { /* tabela pode nao existir ainda; tudo bem */ }

    for (const r of regioesValidadas) {
      await atualizarContadorRegiao(r.id);
    }
    await logEvento(parceiro.id, 'cadastro_iniciado', {
      regioes: regioesValidadas.map(r => r.nome),
      valor_centavos: calcularValorCentavos(regioesValidadas.length),
    });

    res.status(201).json({
      data: parceiro,
      regioes: regioesValidadas.map(r => ({ id: r.id, nome: r.nome, slug: r.slug })),
      valor_mensal_centavos: calcularValorCentavos(regioesValidadas.length),
      valor_mensal_reais: calcularValorCentavos(regioesValidadas.length) / 100,
      proximos_passos: ['contrato', 'pagamento'],
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function enviarContrato(req, res) {
  try {
    const parceiroId = parseInt(req.params.id);
    const { data: p } = await supabase
      .from('parceiros')
      .select('*, regioes(nome)')
      .eq('id', parceiroId)
      .maybeSingle();
    if (!p) return res.status(404).json({ error: 'parceiro nao encontrado' });

    if (!clicksign.isConfigured()) {
      const fakeKey = 'mock-' + Date.now();
      await supabase.from('parceiros').update({ clicksign_document_key: fakeKey }).eq('id', parceiroId);
      await logEvento(parceiroId, 'contrato_mock_gerado', { document_key: fakeKey, motivo: 'ClickSign nao configurado' });
      return res.json({
        document_key: fakeKey,
        signed_url: '#mock-clicksign',
        mock: true,
        message: 'ClickSign nao configurado. Contrato em modo simulado para desenvolvimento.',
      });
    }

    const valorReais = PLAN_VALOR_CENTAVOS / 100;
    const conteudoBase64 = clicksign.gerarContratoBase64({
      nome: p.nome,
      cpf: p.cpf_cnpj,
      regiao: (p.regioes && p.regioes.nome) || 'N/A',
      valor: valorReais,
    });

    const doc = await clicksign.criarDocumento({
      nome: 'contrato-parceiro-' + parceiroId + '.pdf',
      conteudoBase64,
      mimetype: 'text/plain',
    });

    const signer = await clicksign.adicionarSignatario({
      documentKey: doc.key,
      nome: p.nome,
      email: p.email,
      whatsapp: p.whatsapp,
      cpf: p.cpf_cnpj,
    });

    await clicksign.vincularSignatario({
      documentKey: doc.key,
      signerKey: signer.key,
      signAs: 'contractor',
    });

    await supabase.from('parceiros').update({ clicksign_document_key: doc.key }).eq('id', parceiroId);
    await logEvento(parceiroId, 'contrato_enviado', { document_key: doc.key });

    res.json({ document_key: doc.key, signed_url: doc.signed_url || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function iniciarPagamento(req, res) {
  try {
    const parceiroId = parseInt(req.params.id);
    const { data: p } = await supabase.from('parceiros').select('*').eq('id', parceiroId).maybeSingle();
    if (!p) return res.status(404).json({ error: 'parceiro nao encontrado' });

    if (!pagbank.isConfigured()) {
      const fakeSubId = 'mock-sub-' + Date.now();
      const trialEndsAt = new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('parceiros').update({
        pagbank_subscription_id: fakeSubId,
        trial_ends_at: trialEndsAt,
        subscription_started_at: new Date().toISOString(),
        status: 'ocupado',
      }).eq('id', parceiroId);
      await atualizarContadorRegiao(p.regiao_id);
      await logEvento(parceiroId, 'subscription_mock', { subscription_id: fakeSubId });
      return res.json({
        subscription_id: fakeSubId,
        trial_ends_at: trialEndsAt,
        mock: true,
        message: 'PagBank nao configurado. Subscription em modo simulado.',
      });
    }

    const customer = await pagbank.criarCustomer({
      nome: p.nome,
      email: p.email,
      cpf_cnpj: p.cpf_cnpj,
      whatsapp: p.whatsapp,
    });

    await supabase.from('parceiros').update({ pagbank_customer_id: customer.id }).eq('id', parceiroId);
    await logEvento(parceiroId, 'customer_criado', { customer_id: customer.id });

    res.json({
      customer_id: customer.id,
      proximo_passo: 'enviar_metodo_pagamento',
      url_checkout: process.env.LP_BASE_URL + '/parceiros/' + parceiroId + '/checkout',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function listar(req, res) {
  try {
    const status = req.query.status;
    let q = supabase
      .from('parceiros')
      .select('*, regioes(nome, slug)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function get(req, res) {
  try {
    const { data } = await supabase
      .from('parceiros')
      .select('*, regioes(nome, slug)')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!data) return res.status(404).json({ error: 'parceiro nao encontrado' });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function cancelar(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { data: p } = await supabase.from('parceiros').select('*').eq('id', id).maybeSingle();
    if (!p) return res.status(404).json({ error: 'parceiro nao encontrado' });

    if (p.pagbank_subscription_id && pagbank.isConfigured() && !p.pagbank_subscription_id.startsWith('mock')) {
      try { await pagbank.cancelSubscription(p.pagbank_subscription_id); } catch (e) { /* log */ }
    }

    await supabase.from('parceiros').update({ status: 'cancelado', updated_at: new Date().toISOString() }).eq('id', id);
    await atualizarContadorRegiao(p.regiao_id);
    await logEvento(id, 'cancelamento', { motivo: req.body && req.body.motivo });
    res.json({ cancelado: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  iniciarCadastro,
  enviarContrato,
  iniciarPagamento,
  listar,
  get,
  cancelar,
  atualizarContadorRegiao,
  logEvento,
};
