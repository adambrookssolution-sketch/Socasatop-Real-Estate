const whatsapp = require('./whatsapp');
const permissions = require('./permissions');

const ADMS = permissions.ADM_PHONES || [];

async function send(text) {
  for (const adm of ADMS) {
    try { await whatsapp.sendText(adm, text); } catch (e) { /* swallow */ }
  }
}

function fmtParceiro(p) {
  const tipo = p.tipo_parceiro === 'imobiliaria' ? 'IMOBILIARIA' : 'CORRETOR';
  let s = '[' + tipo + '] ' + (p.nome || '');
  if (p.whatsapp) s += '\nWhatsApp: ' + p.whatsapp;
  if (p.email) s += '\nEmail: ' + p.email;
  if (p.cpf_cnpj) s += '\nDoc: ' + p.cpf_cnpj;
  if (p.creci) s += '\nCRECI: ' + p.creci;
  if (p.endereco) s += '\nEndereco: ' + p.endereco;
  if (p.tipo_parceiro === 'imobiliaria' && p.representante_nome) {
    s += '\nRepresentante: ' + p.representante_nome + (p.representante_cpf ? ' (CPF ' + p.representante_cpf + ')' : '');
  }
  return s;
}

async function cadastroIniciado(parceiro, regioes, valorReais) {
  const regsStr = (regioes || []).map(r => r.nome || r).join(', ') || '?';
  const msg = '[SOCASATOP] Novo cadastro de parceiro #' + parceiro.id + '\n\n'
    + fmtParceiro(parceiro)
    + '\nRegiao(oes): ' + regsStr
    + '\nValor mensal: R$ ' + Number(valorReais || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    + '\n\nPROXIMOS PASSOS DO PARCEIRO: cadastrar cartao + assinar contrato.';
  await send(msg);
}

async function cartaoCadastrado(parceiro, trialEndsAt) {
  const trial = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString('pt-BR') : '?';
  const msg = '[SOCASATOP] Cartao cadastrado - parceiro #' + parceiro.id + ' (' + parceiro.nome + ')\n\n'
    + 'Validacao R$ 0,01: OK\n'
    + 'Trial 21 dias iniciado.\n'
    + 'Primeira cobranca: ' + trial + '\n\n'
    + 'PROXIMO: enviar contrato pra assinatura.';
  await send(msg);
}

async function contratoEnviado(parceiro, documentKey) {
  const msg = '[SOCASATOP] Contrato enviado - parceiro #' + parceiro.id + ' (' + parceiro.nome + ')\n\n'
    + 'ClickSign doc: ' + (documentKey || 'mock')
    + '\n\nAguardando assinatura do parceiro.';
  await send(msg);
}

async function contratoAssinado(parceiro) {
  const tipo = parceiro.tipo_parceiro === 'imobiliaria' ? 'IMOBILIARIA' : 'CORRETOR';
  let msg = '[SOCASATOP] CONTRATO ASSINADO - parceiro #' + parceiro.id + ' (' + parceiro.nome + ')\n\n';
  msg += 'Tipo: ' + tipo + '\n\n';
  msg += 'PROXIMOS PASSOS DO ADM:\n';
  msg += '1. Enviar mensagem de boas-vindas ao parceiro\n';
  if (parceiro.tipo_parceiro === 'imobiliaria') {
    msg += '2. Solicitar contato do Gestor da imobiliaria\n';
    msg += '3. Cadastrar Gestor (comando: cadastrar gestor)\n';
    msg += '4. Gestor cadastra Corretores e sobe imoveis\n';
  } else {
    msg += '2. Cadastrar este parceiro como Corretor\n';
    msg += '3. Ele sobe os imoveis (atribuidos automaticamente a ele)\n';
    msg += '4. Curadoria + publicacao\n';
  }
  await send(msg);
}

async function pagamentoFalhou(parceiro, motivo) {
  const msg = '[SOCASATOP] FALHA NO PAGAMENTO - parceiro #' + parceiro.id + ' (' + (parceiro.nome || '') + ')\n\n'
    + 'Motivo: ' + (motivo || 'desconhecido')
    + '\n\nVerificar no painel PagBank.';
  await send(msg);
}

module.exports = {
  cadastroIniciado,
  cartaoCadastrado,
  contratoEnviado,
  contratoAssinado,
  pagamentoFalhou,
};
