const supabase = require('../config/supabase');

async function getSaldo(parceiroTipo, parceiroId) {
  const { data } = await supabase
    .from('creditos_saldo')
    .select('*')
    .eq('parceiro_tipo', parceiroTipo)
    .eq('parceiro_id', parceiroId)
    .maybeSingle();

  if (!data) return { creditos_disponiveis: 0, validade_at: null };

  if (data.validade_at && new Date(data.validade_at).getTime() < Date.now()) {
    if (data.creditos_disponiveis > 0) {
      await registrarTransacao({
        parceiro_tipo: parceiroTipo,
        parceiro_id: parceiroId,
        tipo: 'expiracao',
        quantidade: -data.creditos_disponiveis,
        saldo_apos: 0,
        metadata: { motivo: 'validade vencida' },
      });
      await supabase
        .from('creditos_saldo')
        .update({ creditos_disponiveis: 0, updated_at: new Date().toISOString() })
        .eq('id', data.id);
    }
    return { creditos_disponiveis: 0, validade_at: data.validade_at, expirado: true };
  }
  return data;
}

async function registrarTransacao(payload) {
  const { error } = await supabase.from('creditos_transacoes').insert(payload);
  if (error) throw error;
}

async function adicionarCreditos({ parceiroTipo, parceiroId, quantidade, pacoteId, pagamentoId, validadeDias }) {
  if (quantidade <= 0) throw new Error('quantidade deve ser positiva');

  const saldoAtual = await getSaldo(parceiroTipo, parceiroId);
  const novoSaldo = (saldoAtual.creditos_disponiveis || 0) + quantidade;
  const novaValidade = new Date(Date.now() + (validadeDias || 30) * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('creditos_saldo').upsert({
    parceiro_tipo: parceiroTipo,
    parceiro_id: parceiroId,
    creditos_disponiveis: novoSaldo,
    validade_at: novaValidade,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'parceiro_tipo,parceiro_id' });

  await registrarTransacao({
    parceiro_tipo: parceiroTipo,
    parceiro_id: parceiroId,
    tipo: 'compra',
    quantidade: quantidade,
    saldo_apos: novoSaldo,
    pacote_id: pacoteId || null,
    pagamento_id: pagamentoId || null,
  });

  return { creditos_disponiveis: novoSaldo, validade_at: novaValidade };
}

async function debitarCreditos({ parceiroTipo, parceiroId, quantidade, imovelId, motivo }) {
  if (quantidade <= 0) throw new Error('quantidade deve ser positiva');

  const saldo = await getSaldo(parceiroTipo, parceiroId);
  if ((saldo.creditos_disponiveis || 0) < quantidade) {
    throw new Error('Saldo insuficiente. Disponivel: ' + (saldo.creditos_disponiveis || 0) + ', necessario: ' + quantidade);
  }

  const novoSaldo = saldo.creditos_disponiveis - quantidade;

  await supabase.from('creditos_saldo')
    .update({ creditos_disponiveis: novoSaldo, updated_at: new Date().toISOString() })
    .eq('parceiro_tipo', parceiroTipo)
    .eq('parceiro_id', parceiroId);

  await registrarTransacao({
    parceiro_tipo: parceiroTipo,
    parceiro_id: parceiroId,
    tipo: 'uso',
    quantidade: -quantidade,
    saldo_apos: novoSaldo,
    imovel_id: imovelId || null,
    metadata: { motivo: motivo || 'curadoria' },
  });

  return { creditos_disponiveis: novoSaldo };
}

async function reembolsarCreditos({ parceiroTipo, parceiroId, quantidade, imovelId, motivo }) {
  if (quantidade <= 0) throw new Error('quantidade deve ser positiva');

  const saldo = await getSaldo(parceiroTipo, parceiroId);
  const novoSaldo = (saldo.creditos_disponiveis || 0) + quantidade;

  await supabase.from('creditos_saldo').upsert({
    parceiro_tipo: parceiroTipo,
    parceiro_id: parceiroId,
    creditos_disponiveis: novoSaldo,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'parceiro_tipo,parceiro_id' });

  await registrarTransacao({
    parceiro_tipo: parceiroTipo,
    parceiro_id: parceiroId,
    tipo: 'reembolso',
    quantidade: quantidade,
    saldo_apos: novoSaldo,
    imovel_id: imovelId || null,
    metadata: { motivo: motivo || 'falha na curadoria' },
  });

  return { creditos_disponiveis: novoSaldo };
}

async function listarPacotes() {
  const { data } = await supabase
    .from('pacotes_creditos')
    .select('*')
    .eq('ativo', true)
    .order('preco_centavos');
  return data || [];
}

async function getPacote(id) {
  const { data } = await supabase
    .from('pacotes_creditos')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data;
}

async function listarTransacoes({ parceiroTipo, parceiroId, limit = 30 }) {
  const { data } = await supabase
    .from('creditos_transacoes')
    .select('*')
    .eq('parceiro_tipo', parceiroTipo)
    .eq('parceiro_id', parceiroId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

module.exports = {
  getSaldo,
  adicionarCreditos,
  debitarCreditos,
  reembolsarCreditos,
  listarPacotes,
  getPacote,
  listarTransacoes,
  registrarTransacao,
};
