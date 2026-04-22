const supabase = require('../config/supabase');
const whatsappService = require('./whatsapp');
const permissions = require('./permissions');
const imobiliariasCtrl = require('../controllers/imobiliarias');
const gestoresCtrl = require('../controllers/gestores');
const importCtrl = require('../controllers/import');
const tokenUtil = require('../utils/token');

const WIZARDS = new Map();

function siteBase() {
  return process.env.SITE_BASE_URL || 'https://socasatop.com.br';
}

function saveWizard(from, state) {
  WIZARDS.set(from, state);
}
function getWizard(from) {
  return WIZARDS.get(from);
}
function clearWizard(from) {
  WIZARDS.delete(from);
}

async function send(from, msg) {
  try { await whatsappService.sendText(from, msg); } catch (e) { /* ignore */ }
}

// -- CADASTRAR IMOBILIARIA (ADM only) --
async function startCadastroImobiliaria(from) {
  if (!permissions.isADM(from)) {
    await send(from, 'Apenas o ADM pode cadastrar imobiliarias.');
    return true;
  }
  saveWizard(from, { flow: 'imobiliaria', step: 'nome', data: {} });
  await send(from, 'Cadastro de Imobiliaria.\n\nQual o nome da imobiliaria?');
  return true;
}

async function handleWizardImobiliaria(from, text, state) {
  const t = text.trim();
  if (t.toLowerCase() === 'cancelar') { clearWizard(from); await send(from, 'Cadastro cancelado.'); return; }

  switch (state.step) {
    case 'nome':
      state.data.nome = t;
      state.step = 'cnpj';
      saveWizard(from, state);
      await send(from, 'CNPJ da imobiliaria? (ou "pular")');
      break;
    case 'cnpj':
      if (t.toLowerCase() !== 'pular') state.data.cnpj = t.replace(/\D/g, '');
      state.step = 'responsavel';
      saveWizard(from, state);
      await send(from, 'Nome do responsavel?');
      break;
    case 'responsavel':
      state.data.responsavel = t;
      state.step = 'whatsapp_gestor';
      saveWizard(from, state);
      await send(from, 'WhatsApp do Gestor? (numero com DDD)');
      break;
    case 'whatsapp_gestor':
      state.data.whatsapp_gestor = t.replace(/\D/g, '');
      state.step = 'site';
      saveWizard(from, state);
      await send(from, 'Link do site? (ou "pular")');
      break;
    case 'site':
      if (t.toLowerCase() !== 'pular') state.data.site = t;
      state.step = 'regras';
      saveWizard(from, state);
      await send(from, 'Regras comerciais? (texto livre ou "pular")');
      break;
    case 'regras':
      if (t.toLowerCase() !== 'pular') state.data.regras_comerciais = t;
      try {
        const imob = await imobiliariasCtrl.createFromData(state.data);
        clearWizard(from);
        await send(from, 'Imobiliaria cadastrada!\nID: ' + imob.id + '\nNome: ' + imob.nome + '\n\nAgora cadastre o Gestor com: cadastrar gestor');
      } catch (e) {
        clearWizard(from);
        await send(from, 'Erro ao cadastrar: ' + e.message);
      }
      break;
  }
}

// -- CADASTRAR GESTOR (ADM only) --
async function startCadastroGestor(from) {
  if (!permissions.isADM(from)) {
    await send(from, 'Apenas o ADM pode cadastrar gestores.');
    return true;
  }
  try {
    const { data: imobs } = await supabase.from('imobiliarias').select('id, nome').eq('ativo', true).order('id', { ascending: false }).limit(20);
    if (!imobs || imobs.length === 0) {
      await send(from, 'Nenhuma imobiliaria cadastrada. Use: cadastrar imobiliaria');
      return true;
    }
    const list = imobs.map(i => i.id + ' - ' + i.nome).join('\n');
    saveWizard(from, { flow: 'gestor', step: 'imobiliaria', data: {} });
    await send(from, 'Cadastro de Gestor.\n\nImobiliarias disponiveis:\n' + list + '\n\nDigite o ID da imobiliaria:');
  } catch (e) {
    await send(from, 'Erro: ' + e.message);
  }
  return true;
}

async function handleWizardGestor(from, text, state) {
  const t = text.trim();
  if (t.toLowerCase() === 'cancelar') { clearWizard(from); await send(from, 'Cadastro cancelado.'); return; }

  switch (state.step) {
    case 'imobiliaria':
      const imobId = parseInt(t);
      if (!imobId) { await send(from, 'ID invalido. Digite o numero.'); return; }
      state.data.imobiliaria_id = imobId;
      state.step = 'nome';
      saveWizard(from, state);
      await send(from, 'Nome do Gestor?');
      break;
    case 'nome':
      state.data.nome = t;
      state.step = 'whatsapp';
      saveWizard(from, state);
      await send(from, 'WhatsApp do Gestor? (numero com DDD)');
      break;
    case 'whatsapp':
      state.data.whatsapp = t.replace(/\D/g, '');
      state.step = 'email';
      saveWizard(from, state);
      await send(from, 'Email? (ou "pular")');
      break;
    case 'email':
      if (t.toLowerCase() !== 'pular') state.data.email = t;
      try {
        const g = await gestoresCtrl.createFromData(state.data);
        clearWizard(from);
        await send(from, 'Gestor cadastrado!\nID: ' + g.id + '\nNome: ' + g.nome + '\n\nO gestor ja pode usar o sistema pelo WhatsApp.');
      } catch (e) {
        clearWizard(from);
        await send(from, 'Erro: ' + e.message);
      }
      break;
  }
}

// -- CADASTRAR CORRETOR (ADM ou Gestor) --
async function startCadastroCorretor(from) {
  const role = await permissions.getRole(from);
  if (role.role !== 'adm' && role.role !== 'gestor') {
    await send(from, 'Apenas ADM ou Gestor pode cadastrar corretor.');
    return true;
  }
  saveWizard(from, { flow: 'corretor', step: 'nome', data: { _role: role.role, _entity: role.entity } });
  await send(from, 'Cadastro de Corretor.\n\nNome do corretor?');
  return true;
}

async function handleWizardCorretor(from, text, state) {
  const t = text.trim();
  if (t.toLowerCase() === 'cancelar') { clearWizard(from); await send(from, 'Cadastro cancelado.'); return; }

  switch (state.step) {
    case 'nome':
      state.data.nome = t;
      state.step = 'whatsapp';
      saveWizard(from, state);
      await send(from, 'WhatsApp do corretor? (numero com DDD)');
      break;
    case 'whatsapp':
      state.data.whatsapp = t.replace(/\D/g, '');
      state.step = 'creci';
      saveWizard(from, state);
      await send(from, 'CRECI? (ou "pular")');
      break;
    case 'creci':
      if (t.toLowerCase() !== 'pular') state.data.creci = t;
      state.step = 'email';
      saveWizard(from, state);
      await send(from, 'Email? (ou "pular")');
      break;
    case 'email':
      if (t.toLowerCase() !== 'pular') state.data.email = t;
      state.step = 'especialidade';
      saveWizard(from, state);
      await send(from, 'Especialidade ou regiao? (ex: Lago Sul, Parkway)');
      break;
    case 'especialidade':
      state.data.especialidade = t;
      state.data.regiao = t;
      if (state.data._role === 'gestor') {
        const gestor = state.data._entity;
        state.data.imobiliaria_id = gestor.imobiliaria_id;
        state.data.autonomo = false;
        delete state.data._role;
        delete state.data._entity;
        await finalizeCorretor(from, state);
      } else {
        state.step = 'vinculo';
        saveWizard(from, state);
        await send(from, 'Corretor autonomo ou vinculado a imobiliaria?\n1 - Autonomo\n2 - Vinculado');
      }
      break;
    case 'vinculo':
      if (t === '1' || t.toLowerCase().includes('auto')) {
        state.data.autonomo = true;
        state.data.imobiliaria_id = null;
        delete state.data._role;
        delete state.data._entity;
        await finalizeCorretor(from, state);
      } else if (t === '2' || t.toLowerCase().includes('vin')) {
        const { data: imobs } = await supabase.from('imobiliarias').select('id, nome').eq('ativo', true).order('id', { ascending: false }).limit(20);
        if (!imobs || imobs.length === 0) {
          clearWizard(from);
          await send(from, 'Nenhuma imobiliaria cadastrada. Cadastre uma primeiro.');
          return;
        }
        state.step = 'imobiliaria';
        saveWizard(from, state);
        await send(from, 'Imobiliarias:\n' + imobs.map(i => i.id + ' - ' + i.nome).join('\n') + '\n\nDigite o ID:');
      } else {
        await send(from, 'Digite 1 ou 2.');
      }
      break;
    case 'imobiliaria':
      state.data.imobiliaria_id = parseInt(t);
      state.data.autonomo = false;
      delete state.data._role;
      delete state.data._entity;
      await finalizeCorretor(from, state);
      break;
  }
}

async function finalizeCorretor(from, state) {
  try {
    const payload = { ...state.data, ativo: true };
    const { data, error } = await supabase.from('corretores').insert(payload).select().single();
    if (error) throw error;
    clearWizard(from);
    const vinc = data.autonomo ? 'Autonomo' : 'Imobiliaria #' + data.imobiliaria_id;
    await send(from, 'Corretor cadastrado!\nID: ' + data.id + '\nNome: ' + data.nome + '\nWhatsApp: ' + data.whatsapp + '\nVinculo: ' + vinc);
  } catch (e) {
    clearWizard(from);
    await send(from, 'Erro: ' + e.message);
  }
}

// -- IMPORTAR URL --
async function handleImportar(from, userText) {
  const role = await permissions.getRole(from);
  if (role.role !== 'adm' && role.role !== 'gestor') {
    await send(from, 'Apenas ADM ou Gestor pode importar.');
    return true;
  }
  const m = userText.match(/importar\s+(\S+)/i);
  if (!m) {
    await send(from, 'Use: importar [URL]\nEx: importar https://imobiliaria.com.br/imoveis');
    return true;
  }
  const url = m[1];
  await send(from, 'Iniciando importacao de: ' + url + '\nIsso pode levar alguns minutos. Aviso quando terminar.');

  setImmediate(async () => {
    try {
      const result = await importCtrl.importFromUrl(url, permissions.normalizePhone(from));
      let msg = 'Importacao concluida!\n';
      msg += 'Total encontrado: ' + (result.total || 0) + '\n';
      msg += 'Importados: ' + result.imported + '\n';
      msg += 'Duplicados (ignorados): ' + result.duplicates + '\n';
      msg += 'Erros: ' + result.errors + '\n\n';
      if (result.imported > 0) {
        msg += 'Use "galeria" para abrir a galeria e vincular corretores.';
      }
      await send(from, msg);
    } catch (e) {
      await send(from, 'Erro na importacao: ' + e.message);
    }
  });
  return true;
}

// -- GALERIA: gerar link --
async function handleGaleria(from) {
  const role = await permissions.getRole(from);
  if (role.role !== 'adm' && role.role !== 'gestor') {
    await send(from, 'Apenas ADM ou Gestor pode acessar a galeria.');
    return true;
  }
  try {
    const session = await tokenUtil.createSessionToken({
      whatsapp: permissions.normalizePhone(from),
      role: role.role,
      imobiliaria_id: role.role === 'gestor' ? role.entity.imobiliaria_id : null,
      ttlHours: 24,
    });
    const link = siteBase() + '/galeria/' + session.token;
    await send(from, 'Galeria de gestao (valida por 24h):\n\n' + link + '\n\nSelecione imoveis e vincule corretores, marque visibilidade, publique.');
  } catch (e) {
    await send(from, 'Erro: ' + e.message);
  }
  return true;
}

// -- PENDENTES --
async function handlePendentes(from) {
  const role = await permissions.getRole(from);
  if (role.role !== 'adm' && role.role !== 'gestor') {
    await send(from, 'Apenas ADM ou Gestor.');
    return true;
  }
  try {
    const filter = {};
    if (role.role === 'gestor' && role.entity && role.entity.imobiliaria_id) {
      filter.imobiliaria_id = role.entity.imobiliaria_id;
    }
    const pendentes = await importCtrl.listPending(filter);
    if (pendentes.length === 0) {
      await send(from, 'Nenhum imovel em rascunho.');
      return true;
    }
    const lista = pendentes.slice(0, 20).map(p => {
      const preco = p.amount ? 'R$ ' + Number(p.amount).toLocaleString('pt-BR') : 'Sob consulta';
      return '#' + p.id + ' ' + (p.titulo || '').substring(0, 40) + ' | ' + preco;
    }).join('\n');
    await send(from, 'Rascunhos (' + pendentes.length + '):\n\n' + lista + '\n\nUse "galeria" para gerenciar.');
  } catch (e) {
    await send(from, 'Erro: ' + e.message);
  }
  return true;
}

// -- OCULTO / EXPLICITO / PUBLICAR / DESPUBLICAR --
async function handleVisibility(from, userText) {
  const role = await permissions.getRole(from);
  if (role.role !== 'adm' && role.role !== 'gestor') return false;

  const ocultoMatch = userText.match(/^oculto\s+(\d+)/i);
  const explicitoMatch = userText.match(/^explicito\s+(\d+)/i);

  if (ocultoMatch || explicitoMatch) {
    const id = parseInt((ocultoMatch || explicitoMatch)[1]);
    const visibility = ocultoMatch ? 'oculto' : 'explicito';
    if (!await permissions.canManageImovel(from, id)) {
      await send(from, 'Voce nao tem permissao sobre este imovel.');
      return true;
    }
    try {
      await supabase.from('imoveis').update({ visibility }).eq('id', id);
      await send(from, 'Imovel #' + id + ' marcado como ' + visibility + '.');
    } catch (e) {
      await send(from, 'Erro: ' + e.message);
    }
    return true;
  }

  const publicarMatch = userText.match(/^publicar\s+(\d+)\s+(\w+)/i);
  const despubMatch = userText.match(/^despublicar\s+(\d+)\s+(\w+)/i);
  if (publicarMatch || despubMatch) {
    const m = publicarMatch || despubMatch;
    const id = parseInt(m[1]);
    const canal = m[2].toLowerCase();
    const value = !!publicarMatch;
    const map = { site: 'publish_site', instagram: 'publish_instagram', ig: 'publish_instagram', campanhas: 'publish_campanhas', privado: 'publish_atendimento_privado', atendimento: 'publish_atendimento_privado' };
    const col = map[canal];
    if (!col) {
      await send(from, 'Canal invalido. Use: site, instagram, campanhas, privado');
      return true;
    }
    if (!await permissions.canManageImovel(from, id)) {
      await send(from, 'Sem permissao sobre este imovel.');
      return true;
    }
    try {
      await supabase.from('imoveis').update({ [col]: value }).eq('id', id);
      await send(from, 'Imovel #' + id + ': canal ' + canal + ' = ' + (value ? 'ON' : 'OFF'));
    } catch (e) {
      await send(from, 'Erro: ' + e.message);
    }
    return true;
  }

  return false;
}

// -- APROVAR / REJEITAR RASCUNHO --
async function handleAprovacao(from, userText) {
  const role = await permissions.getRole(from);
  if (role.role !== 'adm' && role.role !== 'gestor') return false;

  const aprovar = userText.match(/^aprovar\s+(\d+)/i);
  const rejeitar = userText.match(/^rejeitar\s+(\d+)/i);
  if (aprovar) {
    const id = parseInt(aprovar[1]);
    if (!await permissions.canManageImovel(from, id)) {
      await send(from, 'Sem permissao.');
      return true;
    }
    try {
      const r = await importCtrl.approveImovel(id);
      await send(from, 'Imovel aprovado: #' + r.id + ' ' + (r.titulo || ''));
    } catch (e) {
      await send(from, 'Erro: ' + e.message);
    }
    return true;
  }
  if (rejeitar) {
    const id = parseInt(rejeitar[1]);
    if (!await permissions.canManageImovel(from, id)) {
      await send(from, 'Sem permissao.');
      return true;
    }
    try {
      await importCtrl.rejectImovel(id);
      await send(from, 'Imovel rejeitado: #' + id);
    } catch (e) {
      await send(from, 'Erro: ' + e.message);
    }
    return true;
  }
  return false;
}

// -- HELP --
async function handleHelp(from) {
  const role = await permissions.getRole(from);
  let msg = 'Comandos disponiveis:\n\n';
  if (role.role === 'adm') {
    msg += 'ADM:\n';
    msg += '- cadastrar imobiliaria\n';
    msg += '- cadastrar gestor\n';
    msg += '- cadastrar corretor\n';
    msg += '- vincular [ID] [nome corretor]\n';
    msg += '- desvincular [ID]\n';
    msg += '- excluir [ID]\n';
    msg += '- corretor [ID]\n';
  } else if (role.role === 'gestor') {
    msg += 'Gestor:\n';
    msg += '- cadastrar corretor\n';
  }
  if (role.role === 'adm' || role.role === 'gestor') {
    msg += '- importar [URL]\n';
    msg += '- pendentes\n';
    msg += '- galeria\n';
    msg += '- oculto [ID] / explicito [ID]\n';
    msg += '- publicar [ID] [canal] / despublicar [ID] [canal]\n';
    msg += '- aprovar [ID] / rejeitar [ID]\n';
    msg += '- cancelar (durante cadastro)\n';
  }
  msg += '\nCanais: site, instagram, campanhas, privado';
  await send(from, msg);
  return true;
}

// -- MAIN DISPATCHER --
async function tryHandleCommand(from, userText) {
  const state = getWizard(from);
  if (state) {
    if (state.flow === 'imobiliaria') await handleWizardImobiliaria(from, userText, state);
    else if (state.flow === 'gestor') await handleWizardGestor(from, userText, state);
    else if (state.flow === 'corretor') await handleWizardCorretor(from, userText, state);
    return true;
  }

  const t = (userText || '').trim();
  const lower = t.toLowerCase();

  if (/^cadastrar\s+imobili/i.test(t)) return await startCadastroImobiliaria(from);
  if (/^cadastrar\s+gestor/i.test(t)) return await startCadastroGestor(from);
  if (/^cadastrar\s+corretor/i.test(t) && getWizard(from) == null) {
    return await startCadastroCorretor(from);
  }
  if (/^importar\s+/i.test(t)) return await handleImportar(from, t);
  if (lower === 'galeria') return await handleGaleria(from);
  if (lower === 'pendentes') return await handlePendentes(from);
  if (lower === 'ajuda' || lower === 'help' || lower === 'comandos') return await handleHelp(from);

  if (await handleVisibility(from, t)) return true;
  if (await handleAprovacao(from, t)) return true;

  return false;
}

module.exports = { tryHandleCommand, getWizard, clearWizard };
