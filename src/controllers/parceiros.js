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
  const seed = regiao.vagas_seed || 0;
  if ((regiao.vagas_ocupadas || 0) >= (regiao.vagas_total || 0)) {
    throw new Error('Vagas esgotadas para ' + regiao.nome);
  }
  const { count } = await supabase
    .from('parceiros')
    .select('*', { count: 'exact', head: true })
    .eq('regiao_id', regiaoId)
    .in('status', ['reservado', 'ocupado']);
  if (((count || 0) + seed) >= (regiao.vagas_total || 0)) {
    throw new Error('Vagas esgotadas para ' + regiao.nome + ' (verificacao em tempo real)');
  }
  return regiao;
}

async function atualizarContadorRegiao(regiaoId) {
  const { data: regiao } = await supabase.from('regioes').select('vagas_seed, vagas_total').eq('id', regiaoId).maybeSingle();
  const seed = (regiao && regiao.vagas_seed) || 0;
  const total = (regiao && regiao.vagas_total) || 0;
  const { count } = await supabase
    .from('parceiros')
    .select('*', { count: 'exact', head: true })
    .eq('regiao_id', regiaoId)
    .in('status', ['reservado', 'ocupado']);
  const ocupadas = Math.min(total, (count || 0) + seed);
  await supabase.from('regioes').update({ vagas_ocupadas: ocupadas }).eq('id', regiaoId);
}

async function iniciarCadastro(req, res) {
  try {
    const { nome, whatsapp, email, cpf_cnpj, creci, especialidade, endereco, representante_nome, representante_cpf, regiao_id, regiao_slug, regiao_ids, regiao_slugs, source_landing } = req.body;
    if (!nome || !whatsapp || !email || !cpf_cnpj) {
      return res.status(400).json({ error: 'nome, whatsapp, email e cpf_cnpj obrigatorios' });
    }
    const cpfDigits = (cpf_cnpj || '').replace(/\D/g, '');
    const isPJ = cpfDigits.length === 14;
    if (isPJ && (!representante_nome || !representante_cpf)) {
      return res.status(400).json({ error: 'Para PJ (CNPJ), representante_nome e representante_cpf sao obrigatorios' });
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
        endereco: endereco || null,
        representante_nome: isPJ ? representante_nome : null,
        representante_cpf: isPJ ? (representante_cpf || '').replace(/\D/g, '') : null,
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

    const { data: regioesParc } = await supabase
      .from('parceiros_regioes')
      .select('regiao_id, regioes(nome)')
      .eq('parceiro_id', parceiroId)
      .in('status', ['reservado', 'ocupado']);
    const nomesRegioes = (regioesParc || []).map(x => x.regioes && x.regioes.nome).filter(Boolean);
    const regioesFinal = nomesRegioes.length ? nomesRegioes : [(p.regioes && p.regioes.nome) || 'N/A'];
    const numRegioes = regioesFinal.length;
    const valorReais = calcularValorCentavos(numRegioes) / 100;

    const cpfDigits = (p.cpf_cnpj || '').replace(/\D/g, '');
    const tipoPessoa = cpfDigits.length === 14 ? 'PJ' : 'PF';
    const conteudoBase64 = await clicksign.gerarContratoBase64({
      nome: p.nome,
      cpf: p.cpf_cnpj,
      regioes: regioesFinal,
      valor: valorReais,
      creci: p.creci,
      endereco: p.endereco,
      representante_nome: p.representante_nome,
      representante_cpf: p.representante_cpf,
      tipo_pessoa: tipoPessoa,
    });

    const doc = await clicksign.criarDocumento({
      nome: 'contrato-parceiro-' + parceiroId + '.pdf',
      conteudoBase64,
      mimetype: 'application/pdf',
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

async function cadastrarCartao(req, res) {
  try {
    const parceiroId = parseInt(req.params.id);
    const { card_token, holder_name, holder_tax_id } = req.body;
    if (!card_token) return res.status(400).json({ error: 'card_token obrigatorio' });

    const { data: p } = await supabase.from('parceiros').select('*').eq('id', parceiroId).maybeSingle();
    if (!p) return res.status(404).json({ error: 'parceiro nao encontrado' });

    const { count: nRegioes } = await supabase
      .from('parceiros_regioes')
      .select('*', { count: 'exact', head: true })
      .eq('parceiro_id', parceiroId)
      .in('status', ['reservado', 'ocupado']);
    const numRegioes = Math.max(1, nRegioes || 1);
    const valorCentavos = calcularValorCentavos(numRegioes);

    if (!pagbank.isConfigured()) {
      const fakeSubId = 'mock-sub-' + Date.now();
      const trialEndsAt = new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('parceiros').update({
        pagbank_subscription_id: fakeSubId,
        trial_ends_at: trialEndsAt,
        subscription_started_at: new Date().toISOString(),
        cartao_cadastrado_em: new Date().toISOString(),
      }).eq('id', parceiroId);
      await logEvento(parceiroId, 'cartao_mock_cadastrado', { subscription_id: fakeSubId, valor_centavos: valorCentavos, num_regioes: numRegioes });
      return res.json({
        subscription_id: fakeSubId,
        trial_ends_at: trialEndsAt,
        valor_mensal_centavos: valorCentavos,
        proxima_cobranca_em: trialEndsAt,
        mock: true,
        message: 'Modo simulado. Cartao "registrado", trial 21 dias iniciado.',
      });
    }

    const validacao = await pagbank.validarCartao({
      cardToken: card_token,
      holderName: holder_name || p.nome,
      holderTaxId: holder_tax_id || p.cpf_cnpj,
      customerEmail: p.email,
    });
    await logEvento(parceiroId, 'cartao_validado', validacao);
    if (!validacao.valid) {
      return res.status(402).json({
        error: 'Cartao recusado na validacao de R$ 0,01',
        status: validacao.status,
        response_message: validacao.response_message,
        response_code: validacao.response_code,
      });
    }

    let customerId = p.pagbank_customer_id;
    if (!customerId) {
      const customer = await pagbank.criarCustomer({
        nome: p.nome, email: p.email, cpf_cnpj: p.cpf_cnpj, whatsapp: p.whatsapp,
      });
      customerId = customer.id;
      await supabase.from('parceiros').update({ pagbank_customer_id: customerId }).eq('id', parceiroId);
      await logEvento(parceiroId, 'customer_criado', { customer_id: customerId });
    }

    const plano = await pagbank.criarPlano({
      nome: 'Parceiro Socasatop ' + numRegioes + (numRegioes === 1 ? ' regiao' : ' regioes'),
      valorCentavos,
      intervalo: 'MONTH',
      descricao: 'Plano parceiro com ' + numRegioes + ' regiao(oes), trial ' + TRIAL_DIAS + ' dias',
    });
    await logEvento(parceiroId, 'plano_criado', { plan_id: plano.id, valor_centavos: valorCentavos });

    const subscription = await pagbank.criarSubscription({
      planId: plano.id,
      customerId,
      paymentMethod: [{
        type: 'CREDIT_CARD',
        card: {
          encrypted: card_token,
          security_code: undefined,
          holder: holder_name || holder_tax_id ? {
            name: holder_name || p.nome,
            tax_id: (holder_tax_id || p.cpf_cnpj || '').replace(/\D/g, ''),
          } : undefined,
        },
      }],
    });

    const trialEndsAt = new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('parceiros').update({
      pagbank_subscription_id: subscription.id,
      pagbank_plan_id: plano.id,
      trial_ends_at: trialEndsAt,
      subscription_started_at: new Date().toISOString(),
      cartao_cadastrado_em: new Date().toISOString(),
    }).eq('id', parceiroId);
    await logEvento(parceiroId, 'subscription_criada', {
      subscription_id: subscription.id, plan_id: plano.id, valor_centavos: valorCentavos, trial_dias: TRIAL_DIAS,
    });

    res.json({
      subscription_id: subscription.id,
      trial_ends_at: trialEndsAt,
      valor_mensal_centavos: valorCentavos,
      valor_mensal_reais: valorCentavos / 100,
      proxima_cobranca_em: trialEndsAt,
      message: 'Cartao registrado. Trial de ' + TRIAL_DIAS + ' dias iniciado. Primeira cobranca apos esse periodo.',
    });
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
  cadastrarCartao,
  enviarContrato,
  iniciarPagamento,
  listar,
  get,
  cancelar,
  atualizarContadorRegiao,
  logEvento,
};
