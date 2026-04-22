const whatsappService = require('../services/whatsapp');
const aiService = require('../services/ai');
const imoveisService = require('../services/imoveis');
const leadsService = require('../services/leads');
const supabase = require('../config/supabase');

// Persistent conversation storage (file-based)
const fs = require('fs');
const path = require('path');
const CONV_DIR = process.env.CONV_DIR || '/root/socasatop/conversations';
try { if (!fs.existsSync(CONV_DIR)) fs.mkdirSync(CONV_DIR, { recursive: true }); } catch(e) {}

function getConversation(phone) {
  try {
    const file = `${CONV_DIR}/${phone}.json`;
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      // Only keep last 24 hours
      if (data.updated && Date.now() - data.updated < 86400000) return data.messages || [];
    }
  } catch(e) {}
  return [];
}

function saveConversation(phone, messages) {
  try {
    const file = `${CONV_DIR}/${phone}.json`;
    const keep = messages.slice(-20);
    fs.writeFileSync(file, JSON.stringify({ messages: keep, updated: Date.now() }));
  } catch(e) {}
}

// ADM phone (can register corretores + imoveis)
const ADM_PHONES = (process.env.ADM_PHONE || '556181288923').split(',').map(p => p.trim().replace(/\D/g, ''));

function isADM(phone) {
  const clean = phone.replace(/\D/g, '');
  return ADM_PHONES.some(adm => clean === adm || adm.endsWith(clean) || clean.endsWith(adm));
}

// Modo de cadastro - file-backed to survive PM2 restarts
const cadastroDir = path.join(__dirname, '..', '..', 'conversations');
function getCadastro(from, type) {
  try {
    const file = path.join(cadastroDir, `cadastro_${type}_${from}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      // Expire after 10 minutes
      if (Date.now() - data._ts < 600000) return data;
      fs.unlinkSync(file);
    }
  } catch (e) {}
  return null;
}
function setCadastro(from, type, state) {
  try {
    const file = path.join(cadastroDir, `cadastro_${type}_${from}.json`);
    fs.writeFileSync(file, JSON.stringify({ ...state, _ts: Date.now() }));
  } catch (e) {}
}
function deleteCadastro(from, type) {
  try {
    const file = path.join(cadastroDir, `cadastro_${type}_${from}.json`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch (e) {}
}

// Backward-compatible wrappers
const cadastroMode = {
  has: (from) => getCadastro(from, 'imovel') !== null,
  get: (from) => getCadastro(from, 'imovel'),
  set: (from, state) => setCadastro(from, 'imovel', state),
  delete: (from) => deleteCadastro(from, 'imovel'),
};
const cadastroCorretorMode = {
  has: (from) => getCadastro(from, 'corretor') !== null,
  get: (from) => getCadastro(from, 'corretor'),
  set: (from, state) => setCadastro(from, 'corretor', state),
  delete: (from) => deleteCadastro(from, 'corretor'),
};
// Track last search per user (prevent duplicate cards for same search)
const lastSearch = new Map();

function verify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log(' Webhook verificado pelo Meta');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function receive(req, res) {
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const messages = change?.value?.messages || [];

    if (!messages.length) return;

    // Process all messages in the webhook (WhatsApp may batch multiple)
    for (const message of messages) {
    const from = message.from;
    const msgId = message.id;
    const msgType = message.type;

    // markRead is non-blocking - don't await
    whatsappService.markRead(msgId).catch(() => {});

    // Handle image/video during cadastro mode
    if (cadastroMode.has(from) && (msgType === 'image' || msgType === 'video')) {
      const mediaId = message[msgType]?.id;
      if (mediaId) {
        await handleCadastroMedia(from, mediaId, msgType);
      }
      continue;
    }

    if (msgType !== 'text') {
      await whatsappService.sendText(from, 'Olá! Por enquanto só consigo processar mensagens de texto. Como posso te ajudar? ');
      continue;
    }

    const userText = message.text.body;
    console.log(` [${from}]: ${userText}`);

    const lower = userText.toLowerCase().trim();

    // Sprint 1 commands dispatcher (wizards + management)
    try {
      const commandsService = require('../services/commands');
      const handled = await commandsService.tryHandleCommand(from, userText);
      if (handled) return;
    } catch (e) {
      console.log('commands dispatch error:', e.message);
    }

    // Handle ongoing cadastro corretor mode (ADM only)
    if (cadastroCorretorMode.has(from)) {
      await handleCadastroCorretor(from, userText);
      return;
    }

    // Handle ongoing cadastro mode
    if (cadastroMode.has(from)) {
      await handleCadastro(from, userText);
      return;
    }

    // ADM command: cadastrar corretor
    if (lower.includes('cadastrar corretor') || lower.includes('novo corretor')) {
      if (isADM(from)) {
        console.log(` ADM [${from}] starting cadastro corretor`);
        cadastroCorretorMode.set(from, { step: 'nome' });
        await whatsappService.sendText(from, ' *Cadastro de novo corretor*\n\nQual o nome completo do corretor?');
        return;
      } else {
        console.log(` Non-ADM [${from}] tried cadastrar corretor`);
        await whatsappService.sendText(from, ' Apenas o administrador pode cadastrar corretores.');
        return;
      }
    }

    // Corretor commands — check keyword first, then verify corretor
    if (lower.includes('cadastrar') || lower.includes('novo imóvel') || lower.includes('novo imovel')) {
      const isCorretor = await checkCorretor(from);
      if (isCorretor) {
        cadastroMode.set(from, { step: 'titulo' });
        await whatsappService.sendText(from, ' *Cadastro de novo imóvel*\n\nQual o título do imóvel?\n(Ex: Casa 3 quartos - Vicente Pires)');
        return;
      }
    }

    if (lower.match(/vendido\s+\d+/) || lower.match(/vendeu\s+\d+/)) {
      const isCorretor = await checkCorretor(from);
      if (isCorretor) {
        const idMatch = userText.match(/(\d+)/);
        if (idMatch) {
          const imovelId = parseInt(idMatch[1]);
          let success = false;
          try {
            const { error } = await supabase.from('imoveis').update({ ativo: false, updated_at: new Date().toISOString() }).eq('id', imovelId);
            if (!error) success = true;
          } catch (e) { /* fallback */ }

          if (!success) {
            const { execSync } = require('child_process');
            const SUPABASE_IPS = ['104.18.38.10','172.64.149.246','162.159.141.245'];
            const body = JSON.stringify({ ativo: false, updated_at: new Date().toISOString() });
            for (const ip of SUPABASE_IPS) {
              try {
                const host = process.env.SUPABASE_URL.replace('https://','').split('/')[0];
                const cmd = `curl -4 -s --connect-timeout 3 --max-time 10 --connect-to ${host}:443:${ip}:443 -X PATCH "${process.env.SUPABASE_URL}/rest/v1/imoveis?id=eq.${imovelId}" -H "apikey: ${process.env.SUPABASE_SECRET_KEY}" -H "Authorization: Bearer ${process.env.SUPABASE_SECRET_KEY}" -H "Content-Type: application/json" -d '${body}' 2>/dev/null`;
                execSync(cmd, { encoding: 'utf-8', timeout: 15000 });
                success = true; break;
              } catch (e) { /* try next */ }
            }
          }

          if (success) {
            await whatsappService.sendText(from, ` Imóvel #${imovelId} marcado como vendido!`);
          } else {
            await whatsappService.sendText(from, ' Erro temporário. Tente novamente em alguns minutos.');
          }
          return;
        }
      }
    }

    // === VINCULAR/DESVINCULAR CORRETOR (ADM only) ===
    if (lower.match(/^vincular\s+\d+/)) {
      if (isADM(from)) {
        const parts = userText.match(/^vincular\s+(\d+)\s+(.+)/i);
        if (parts) {
          const imovelId = parseInt(parts[1]);
          const corretorName = parts[2].trim();
          try {
            const { data: corrs } = await supabase.from('corretores').select('id,nome,whatsapp').ilike('nome', '%' + corretorName + '%');
            if (corrs && corrs.length > 0) {
              const corretor = corrs[0];
              await supabase.from('imoveis').update({ corretor_id: corretor.id }).eq('id', imovelId);
              const { data: imovel } = await supabase.from('imoveis').select('titulo').eq('id', imovelId).single();
              const titulo = imovel ? imovel.titulo : 'ID ' + imovelId;
              await whatsappService.sendText(from, '\u2705 Vinculado!\n\nImovel: ' + titulo + '\nCorretor: ' + corretor.nome + '\nWhatsApp: ' + corretor.whatsapp + '\n\nhttps://socasatop.com.br/imovel/' + imovelId);
            } else {
              await whatsappService.sendText(from, '\u274c Corretor "' + corretorName + '" nao encontrado.\n\nUse: vincular [ID] [nome]\nEx: vincular 264 Philippi');
            }
          } catch(e) {
            await whatsappService.sendText(from, '\u274c Erro: ' + e.message);
          }
        } else {
          await whatsappService.sendText(from, 'Use: vincular [ID] [nome do corretor]\nEx: vincular 264 Philippi');
        }
        return;
      }
    }

    if (lower.match(/^desvincular\s+\d+/)) {
      if (isADM(from)) {
        const idMatch = userText.match(/(\d+)/);
        if (idMatch) {
          const imovelId = parseInt(idMatch[1]);
          await supabase.from('imoveis').update({ corretor_id: 3 }).eq('id', imovelId);
          const { data: imovel } = await supabase.from('imoveis').select('titulo').eq('id', imovelId).single();
          await whatsappService.sendText(from, '\u2705 Imovel "' + (imovel ? imovel.titulo : imovelId) + '" desvinculado. Agora esta com So Casa Top (Ivan).');
        }
        return;
      }
    }

    if (lower.match(/^corretor\s+\d+/)) {
      if (isADM(from)) {
        const idMatch = userText.match(/(\d+)/);
        if (idMatch) {
          const imovelId = parseInt(idMatch[1]);
          const { data: imovel } = await supabase.from('imoveis').select('titulo,corretor_id').eq('id', imovelId).single();
          if (imovel && imovel.corretor_id) {
            const { data: corr } = await supabase.from('corretores').select('nome,whatsapp').eq('id', imovel.corretor_id).single();
            await whatsappService.sendText(from, 'Imovel: ' + (imovel.titulo || '#' + imovelId) + '\nCorretor: ' + (corr ? corr.nome : 'ID ' + imovel.corretor_id) + '\nWhatsApp: ' + (corr ? corr.whatsapp : '') + '\n\nhttps://socasatop.com.br/imovel/' + imovelId);
          } else {
            await whatsappService.sendText(from, 'Imovel #' + imovelId + ': ' + (imovel ? imovel.titulo : 'Nao encontrado') + '\nSem corretor vinculado');
          }
        }
        return;
      }
    }

        // === SPECIFIC PROPERTY REQUEST (from catalog site) ===
    const idMatch = userText.match(/\(ID[:\s]*?(\d+)\)/i) || userText.match(/\bID[:\s]*?(\d+)\b/i);
    if (idMatch) {
      const requestedId = parseInt(idMatch[1]);
      console.log(`  [SPECIFIC] Property ID ${requestedId} from [${from}]`);
      try {
        const { data: prop, error } = await supabase.from('imoveis').select('*').eq('id', requestedId).eq('ativo', true).single();
        if (prop && !error) {
          let corretorInfo = null;
          if (prop.corretor_id) {
            const { data: corr } = await supabase.from('corretores').select('nome,whatsapp').eq('id', prop.corretor_id).single();
            if (corr) corretorInfo = corr;
          }
          try { await leadsService.upsertLead(from, { offer_type: prop.offer_type, location: prop.location }); } catch(e) {}

          const preco = prop.amount ? `R$ ${Number(prop.amount).toLocaleString('pt-BR')}` : 'Sob consulta';
          const cleanDetails = prop.details ? prop.details.replace(/\r\s*\r/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ').substring(0, 200) + '...' : '';
          let msg = `\u{1F3E0} *${prop.titulo}*\n`;
          msg += `\u{1F4CD} ${prop.neighborhood || prop.location || ''}\n`;
          msg += `\u{1F4B0} ${preco}\n`;
          if (prop.bedrooms) msg += `\u{1F6CF} ${prop.bedrooms} quartos\n`;
          if (prop.size && prop.size >= 20) msg += `\u{1F4D0} ${prop.size}m\u00B2\n`;
          if (cleanDetails) msg += `\n\u{1F4DD} ${cleanDetails}\n`;
          msg += `\n\u{1F449} Ver detalhes: https://socasatop.com.br/imovel/${prop.id}`;

          const imgs = (prop.images || []).filter(u => typeof u === 'string' && u.startsWith('http'));
          const photoUrl = imgs.find(u => /\.(jpg|jpeg|png)$/i.test(u));

          await whatsappService.sendText(from, `\u{00D3}tima escolha! Aqui est\u00E3o os detalhes desse im\u00F3vel \u{1F60A}`);

          if (photoUrl) {
            try { await whatsappService.sendImage(from, photoUrl, msg); }
            catch(e) { await whatsappService.sendText(from, msg); }
          } else {
            await whatsappService.sendText(from, msg);
          }

          let followUp = '\nO que gostaria de fazer agora?\n';
          if (corretorInfo) {
            followUp += `\n\u{1F4AC} *Falar com ${corretorInfo.nome}* (corretor): https://wa.me/${corretorInfo.whatsapp}?text=${encodeURIComponent('Ol\u00E1! Vi o im\u00F3vel ' + prop.titulo + ' na S\u00F3 Casa Top')}`;
          }
          followUp += '\n\u{1F50D} Posso buscar op\u00E7\u00F5es similares na mesma regi\u00E3o';
          followUp += '\n\u{1F3D8} Ou ver im\u00F3veis em outra localidade';
          followUp += '\n\n\u00C9 s\u00F3 me dizer! \u{1F60A}';
          await whatsappService.sendText(from, followUp);

          const historico = getConversation(from);
          historico.push({ role: 'user', content: userText });
          historico.push({ role: 'assistant', content: `Mostrei detalhes do im\u00F3vel ${prop.titulo} (ID:${prop.id})` });
          saveConversation(from, historico);
          return;
        }
      } catch(e) { console.log('Specific property lookup error:', e.message); }
    }

    // Regular lead conversation (persistent)
    const historico = getConversation(from);
    historico.push({ role: 'user', content: userText });

    console.log(`Processing message for [${from}]...`);
    const resposta = await aiService.processMessage(historico.slice(0, -1), userText);
    console.log(` AI response: ${resposta.substring(0, 60)}`);
    historico.push({ role: 'assistant', content: resposta });
    saveConversation(from, historico);

    // Search properties BEFORE sending (Supabase is faster than Facebook)
    const leadData = aiService.extractLeadData(historico);
    const dataPoints = [leadData.offer_type, leadData.property_type, leadData.budget, leadData.bedrooms, leadData.location].filter(Boolean).length;
    const searchKey = `${leadData.offer_type}|${leadData.property_type}|${leadData.location}|${leadData.bedrooms}|${leadData.budget}`;
    const prevSearch = lastSearch.get(from);

    // Check real estate intent in LAST message OR conversation history
    const lastMsg = historico.filter(m => m.role === 'user').pop();
    const lastText = lastMsg ? lastMsg.content.toLowerCase() : '';
    const reKeywords = /compr|alug|vend|casa|apartamento|terreno|comercial|quarto|milh|lago|park|vicente|arniqueira|águas|taguatinga|sobradinho|guar[aá]|noroeste|sudoeste|asa\s|jardim|gama|planaltina|riacho|recanto|samambaia|ceilândia|mangueiral|imovel|imóvel|imóveis|busca|procur|qd\s|qi\s|ql\s/i;
    const followUpKeywords = /similar|parec|outr[oa]s?\s*(op|im|cas|ter)|mais\s*(op|cas|im)|ver\s*(mais|outr|op)|mostrar|enviar|mandar|gostaria|interessad|opcões|opções|alternativ/i;
    const isFollowUp = followUpKeywords.test(lastText);
    const directIntentInLast = reKeywords.test(lastText) || isFollowUp;
    // Detect conversation-ending messages — NEVER search on these
    const endingKeywords = /^(obrigad|valeu|ok|beleza|top|perfeito|show|massa|legal|bom dia|boa tarde|boa noite|tchau|bye|at[eé]|falou|tmj|vlw|thanks|thank|brigad|blz|entendi|certo|combinado|fechado|t[aá] bom|tamo junto)/i;
    const isEnding = endingKeywords.test(lastText.trim()) && lastText.trim().length < 40;
    // If conversation already established RE intent, short follow-ups should continue searching
    const allUserTexts = historico.filter(m => m.role === 'user').map(m => m.content).join(' ').toLowerCase();
    const historyHasIntent = reKeywords.test(allUserTexts);
    // ONLY search when last message has direct RE intent or is a follow-up request
    // History alone is NOT enough — prevents searching on off-topic messages
    const hasRealEstateIntent = !isEnding && directIntentInLast;

    let imoveis = [];
    if (dataPoints >= 2 && hasRealEstateIntent) {
      console.log(` Searching: ${searchKey}`);
      try {
        // Price range: ±25% of budget
        const minBudget = leadData.budget ? Math.round(leadData.budget * 0.75) : null;
        const maxBudget = leadData.budget ? Math.round(leadData.budget * 1.25) : null;

        // Terreno/Comercial don't have bedrooms
        const skipBedrooms = leadData.property_type && ['Terreno', 'Comercial'].includes(leadData.property_type);

        imoveis = await imoveisService.buscarImoveis({
          offer_type: leadData.offer_type,
          property_type: leadData.property_type,
          location: leadData.location,
          bedrooms: skipBedrooms ? null : leadData.bedrooms,
          min_budget: minBudget,
          max_budget: maxBudget,
          limit: 3,
        });

        // Fallback 1: relax bedrooms first (budget is more important to users)
        if (imoveis.length < 3 && leadData.bedrooms && !skipBedrooms) {
          console.log(' Less than 3 results, relaxing bedrooms filter...');
          const more = await imoveisService.buscarImoveis({
            offer_type: leadData.offer_type,
            property_type: leadData.property_type,
            location: leadData.location,
            min_budget: minBudget,
            max_budget: maxBudget,
            limit: 3 - imoveis.length,
          });
          const existingIds = new Set(imoveis.map(i => i.id));
          imoveis.push(...more.filter(i => !existingIds.has(i.id)));
        }

        // Fallback 2: widen budget to ±50% (no bedrooms filter)
        if (imoveis.length < 3 && leadData.budget) {
          console.log(' Still less than 3, widening budget to ±50%...');
          const wideBudgetMin = Math.round(leadData.budget * 0.5);
          const wideBudgetMax = Math.round(leadData.budget * 1.5);
          const more = await imoveisService.buscarImoveis({
            offer_type: leadData.offer_type,
            property_type: leadData.property_type,
            location: leadData.location,
            min_budget: wideBudgetMin,
            max_budget: wideBudgetMax,
            limit: 3 - imoveis.length,
          });
          const existingIds2 = new Set(imoveis.map(i => i.id));
          imoveis.push(...more.filter(i => !existingIds2.has(i.id)));
        }

        // Fallback 3: widen to +/-100% budget, remove bedrooms (last resort)
        if (imoveis.length < 3) {
          console.log(' Last resort, widening budget to +/-100%...');
          const ultraWideMin = leadData.budget ? Math.round(leadData.budget * 0.3) : null;
          const ultraWideMax = leadData.budget ? Math.round(leadData.budget * 2.0) : null;
          const more = await imoveisService.buscarImoveis({
            offer_type: leadData.offer_type,
            property_type: leadData.property_type,
            location: leadData.location,
            min_budget: ultraWideMin,
            max_budget: ultraWideMax,
            limit: 3 - imoveis.length,
          });
          const existingIds3 = new Set(imoveis.map(i => i.id));
          imoveis.push(...more.filter(i => !existingIds3.has(i.id)));
        }

        // Trim to max 3
        imoveis = imoveis.slice(0, 3);

        console.log(` Found: ${imoveis.length} properties`);
      } catch (e) {
        console.log('Search failed:', e.message);
      }

      // Save lead (non-blocking)
      try {
        await leadsService.upsertLead({ whatsapp: from, offer_type: leadData.offer_type, bedrooms: leadData.bedrooms, budget: leadData.budget, location: leadData.location });
      } catch (e) { console.log('Lead save failed:', e.message); }
    }

    // NOW send everything via WhatsApp (this may block due to network)
    console.log(` Sending messages...`);
    try { await whatsappService.sendText(from, resposta); } catch(e) { console.log('AI send failed:', e.message); }

    if (imoveis.length === 0 && dataPoints >= 2 && hasRealEstateIntent && searchKey !== prevSearch) {
      lastSearch.set(from, searchKey);
      // Find a corretor/partner in the requested region
      let regionCorretor = null;
      if (leadData.location) {
        try {
          const { data: corrs } = await supabase.from('corretores').select('nome,whatsapp,regiao').eq('ativo', true).ilike('regiao', '%' + leadData.location + '%').limit(1);
          if (corrs && corrs.length > 0) regionCorretor = corrs[0];
        } catch(e) {}
      }
      if (!regionCorretor) {
        try {
          const { data: corrs } = await supabase.from('corretores').select('nome,whatsapp,regiao').eq('ativo', true).limit(1);
          if (corrs && corrs.length > 0) regionCorretor = corrs[0];
        } catch(e) {}
      }
      let partnerMsg;
      if (regionCorretor) {
        const waLink = `https://wa.me/${regionCorretor.whatsapp}?text=${encodeURIComponent('Ol\u00e1! Estou procurando um im\u00f3vel e a S\u00f3 Casa Top me indicou voc\u00ea.')}`;
        const regLabel = regionCorretor.regiao ? ' \u2014 ' + regionCorretor.regiao : '';
        partnerMsg = `\ud83d\ude14 No momento n\u00e3o temos esse im\u00f3vel na nossa base.\n\nMas temos um parceiro especialista na regi\u00e3o que pode te ajudar:\n\n\ud83d\udc64 *${regionCorretor.nome}*${regLabel}\n\ud83d\udcac Falar no WhatsApp: ${waLink}\n\nEle pode te apresentar op\u00e7\u00f5es exclusivas! \ud83d\ude0a`;
      } else {
        partnerMsg = `\ud83d\ude14 No momento n\u00e3o encontrei im\u00f3veis com esses crit\u00e9rios.\n\nMas posso te ajudar:\n\ud83d\udd0d Quer buscar em outra regi\u00e3o?\n\ud83d\udcb0 Ou ajustar a faixa de pre\u00e7o?\n\n\u00c9 s\u00f3 me dizer! \ud83d\ude0a`;
      }
      try { await whatsappService.sendText(from, partnerMsg); } catch(e) {}
    } else if (imoveis.length > 0) {
      lastSearch.set(from, searchKey);
      try {
        const admMode = isADM(from);

        if (admMode) {
          // === ADM MODE: Send ALL images/videos for Instagram publishing ===
          await whatsappService.sendText(from, ` *Encontrei ${imoveis.length} imóveis para publicação:*`);

          for (let idx = 0; idx < imoveis.length; idx++) {
            try {
              const imovel = imoveis[idx];
              console.log(`   ADM Card ${idx+1}/${imoveis.length}: ID:${imovel.id}`);

              // Full description for Instagram
              const preco = imovel.amount ? `R$ ${Number(imovel.amount).toLocaleString('pt-BR')}` : 'Consulte';
              const quartos = imovel.bedrooms ? `${imovel.bedrooms} quartos` : '';
              const area = imovel.size ? `${imovel.size}m²` : '';
              const local = imovel.neighborhood || imovel.location || '';
              const cond = imovel.condominium ? 'Condomínio' : '';
              const fin = imovel.financing ? 'Aceita financiamento' : '';
              const details = imovel.details || '';
              const baseUrl = process.env.BASE_URL || 'https://socasatop.com.br';

              let desc = ` *${imovel.titulo}*\n`;
              desc += ` ${local}\n`;
              desc += ` ${preco}\n`;
              if (quartos) desc += ` ${quartos}\n`;
              if (area) desc += ` ${area}\n`;
              if (cond) desc += ` ${cond}\n`;
              if (fin) desc += ` ${fin}\n`;
              if (details) desc += `\n ${details}\n`;
              desc += `\n ${baseUrl}/imovel/${imovel.id}`;
              desc += `\n\n _Texto pronto para copiar e publicar no Instagram_`;

              // Send description first
              await whatsappService.sendText(from, desc);
              await new Promise(r => setTimeout(r, 300));

              // Send ALL images and videos (downloadable by Ivan)
              const allMedia = (imovel.images || []).filter(u => typeof u === 'string' && u.startsWith('http') && (u.includes('/wp-content/uploads/') || u.includes('/uploads/')));
              const photos = allMedia.filter(u => /\.(jpg|jpeg|png)$/i.test(u));
              const videos = allMedia.filter(u => /\.(mp4|mov|webm)$/i.test(u));

              let mediaCount = 0;
              // Send up to 10 photos
              for (const photoUrl of photos.slice(0, 10)) {
                try {
                  await whatsappService.sendImage(from, photoUrl, '');
                  mediaCount++;
                  await new Promise(r => setTimeout(r, 300));
                } catch (e) { console.log(`     Photo failed: ${e.message}`); }
              }
              // Send videos (skip >16MB — WhatsApp limit)
              const fs = require('fs');
              for (const vidUrl of videos.slice(0, 3)) {
                try {
                  const vPath = vidUrl.includes('/wp-content/uploads/')
                    ? '/root/socasatop/wp-images' + vidUrl.split('socasatop.com.br')[1]
                    : '/root/socasatop' + vidUrl.split('socasatop.com.br')[1];
                  try {
                    if (fs.existsSync(vPath) && fs.statSync(vPath).size > 16000000) {
                      console.log(`     Video too large (${Math.round(fs.statSync(vPath).size/1048576)}MB), skipping`);
                      continue;
                    }
                  } catch(fe) {}
                  await whatsappService.sendVideo(from, vidUrl, '');
                  mediaCount++;
                  await new Promise(r => setTimeout(r, 300));
                } catch (e) { console.log(`     Video failed: ${e.message}`); }
              }
              console.log(`     ADM: ${mediaCount} media sent for ID:${imovel.id}`);

              // Separator between properties
              if (idx < imoveis.length - 1) {
                await whatsappService.sendText(from, '━━━━━━━━━━━━━━━');
                await new Promise(r => setTimeout(r, 300));
              }
            } catch (cardErr) {
              console.log(`     ADM Card ${idx+1} crashed:`, cardErr.message);
            }
          }
        } else {
          // === NORMAL MODE: Standard cards for clients ===
          await whatsappService.sendText(from, ` *Encontrei ${imoveis.length} opções para você:*`);

          for (let idx = 0; idx < imoveis.length; idx++) {
            try {
              const imovel = imoveis[idx];
              console.log(`   Card ${idx+1}/${imoveis.length}: ID:${imovel.id}`);
              const matchPct = calcMatchPercent(imovel, leadData);
              const matchLabel = matchPct !== null ? `\n *${matchPct}% match*` : '';
              const caption = imoveisService.formatImovelCard(imovel) + matchLabel;

              const imgs = (imovel.images || []).filter(u => typeof u === 'string' && u.startsWith('http') && (u.includes('/wp-content/uploads/') || u.includes('/uploads/')));
              const jpgUrl = imgs.find(u => /\.(jpg|jpeg)$/i.test(u));
              const pngUrl = imgs.find(u => /\.png$/i.test(u));
              const videoUrl = imgs.find(u => /\.(mp4|mov|webm)$/i.test(u));
              let mediaUrl = jpgUrl || videoUrl || pngUrl || null;

              // Skip large PNG files (>5MB) - WhatsApp silently fails
              if (mediaUrl && /\.png$/i.test(mediaUrl)) {
                try {
                  const fs = require('fs');
                  const localPath = mediaUrl.includes('/wp-content/uploads/')
                    ? '/root/socasatop/wp-images' + mediaUrl.split('socasatop.com.br')[1]
                    : '/root/socasatop' + mediaUrl.split('socasatop.com.br')[1];
                  if (fs.existsSync(localPath) && fs.statSync(localPath).size > 4500000) {
                    console.log(`     PNG too large, skipping media`);
                    mediaUrl = null;
                  }
                } catch(e) {}
              }
              console.log(`    Media: ${mediaUrl ? mediaUrl.split('/').pop() : 'NONE'}`);

              let sent = false;
              if (mediaUrl) {
                try {
                  const isVideo = /\.(mp4|mov|webm)$/i.test(mediaUrl);
                  if (isVideo) {
                    // Check video size — WhatsApp drops >16MB silently
                    const fs2 = require('fs');
                    const vp = mediaUrl.includes('/wp-content/uploads/')
                      ? '/root/socasatop/wp-images' + mediaUrl.split('socasatop.com.br')[1]
                      : '/root/socasatop' + mediaUrl.split('socasatop.com.br')[1];
                    try {
                      if (fs2.existsSync(vp) && fs2.statSync(vp).size > 16000000) {
                        console.log('     Video too large, falling back to poster');
                        throw new Error('Video exceeds 16MB');
                      }
                    } catch(fe) { if (fe.message === 'Video exceeds 16MB') throw fe; }
                    await whatsappService.sendVideo(from, mediaUrl, caption);
                  } else {
                    await whatsappService.sendImage(from, mediaUrl, caption);
                  }
                  sent = true;
                  console.log(`     Media+caption sent`);
                } catch (e) { console.log('     Media failed:', e.message); }
              }
              if (!sent) {
                try { await whatsappService.sendText(from, caption); console.log(`     Text-only sent`); } catch(e) { console.log('     Text failed:', e.message); }
              }

              if (idx < imoveis.length - 1) await new Promise(r => setTimeout(r, 500));
            } catch (cardErr) {
              console.log(`     Card ${idx+1} crashed:`, cardErr.message);
            }
          }
        }
      } catch (e) {
        console.log('Card sending failed:', e.message);
      }

      // Follow-up message after sending cards
      if (imoveis.length > 0) {
        try {
          await new Promise(r => setTimeout(r, 3000));
          const followMsgs = [
            'Gostou de alguma op\u00e7\u00e3o? Posso te dar mais detalhes ou buscar em outra regi\u00e3o! \ud83d\ude0a',
            'Quer ver mais op\u00e7\u00f5es ou saber mais sobre algum desses im\u00f3veis? \ud83c\udfe1',
            'Se quiser, posso filtrar por n\u00famero de quartos ou outra faixa de pre\u00e7o! \ud83d\ude09',
          ];
          const followMsg = followMsgs[Math.floor(Math.random() * followMsgs.length)];
          await whatsappService.sendText(from, followMsg);
          console.log('    \u2705 Follow-up sent');
        } catch(e) { console.log('Follow-up failed:', e.message); }
      }
    }

    } // end for loop over messages

  } catch (err) {
    console.error('Erro no webhook:', err.message, err.stack);
  }
}

// Corretor whitelist from env (fallback when Supabase is unreachable)
const CORRETOR_WHITELIST = new Set(
  (process.env.CORRETOR_PHONES || '').split(',').map(p => p.trim()).filter(Boolean)
);
const corretorCache = new Set();

async function checkCorretor(phone) {
  const cleanPhone = phone.replace(/\D/g, '');

  // Brazil phone: WhatsApp sends without 9 (556182212903), DB may have with 9 (5561982212903)
  // Generate both variants
  const variants = [cleanPhone, phone];
  if (cleanPhone.length === 12 && cleanPhone.startsWith('55')) {
    // Add variant with 9: 5561XXXXXXXX -> 55619XXXXXXXX
    variants.push(cleanPhone.slice(0, 4) + '9' + cleanPhone.slice(4));
  }
  if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
    // Add variant without 9: 55619XXXXXXXX -> 5561XXXXXXXX
    variants.push(cleanPhone.slice(0, 4) + cleanPhone.slice(5));
  }

  // Check local whitelist and cache first (no network needed)
  for (const v of variants) {
    if (corretorCache.has(v)) return true;
    if (CORRETOR_WHITELIST.has(v)) { corretorCache.add(cleanPhone); return true; }
  }

  // Try Supabase with retries
  const orFilter = variants.map(v => `whatsapp.eq.${v}`).join(',');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data } = await supabase
        .from('corretores')
        .select('id')
        .or(orFilter)
        .eq('ativo', true)
        .limit(1);
      if (data && data.length > 0) {
        corretorCache.add(cleanPhone);
        return true;
      }
      return false;
    } catch (e) {
      console.log(`checkCorretor attempt ${attempt + 1} failed:`, e.message);
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    }
  }
  return corretorCache.has(cleanPhone);
}

async function handleCadastroMedia(from, mediaId, mediaType) {
  const state = cadastroMode.get(from);
  console.log(` handleCadastroMedia [${from}]: mediaId=${mediaId}, step=${state?.step}, mediaFiles=${JSON.stringify(state?.mediaFiles)}`);
  if (!state || state.step !== 'fotos') return;

  // Prevent duplicate media (WhatsApp may send same media multiple times)
  if (!state.mediaIds) state.mediaIds = [];
  if (state.mediaIds.includes(mediaId)) return;
  state.mediaIds.push(mediaId);

  const media = whatsappService.downloadMedia(mediaId);
  if (media) {
    if (!state.mediaFiles) state.mediaFiles = [];
    state.mediaFiles.push(media.filename);
    cadastroMode.set(from, state);
    const count = state.mediaFiles.length;
    await whatsappService.sendText(from, ` ${mediaType === 'video' ? 'Vídeo' : 'Foto'} ${count} recebida! Envie mais ou digite *pronto* para continuar.`);
  } else {
    await whatsappService.sendText(from, ' Não consegui baixar essa mídia. Envie novamente ou digite *pronto* para continuar.');
  }
}

async function handleCadastro(from, text) {
  const state = cadastroMode.get(from);
  const lower = text.toLowerCase().trim();

  if (lower === 'cancelar') {
    cadastroMode.delete(from);
    await whatsappService.sendText(from, ' Cadastro de imóvel cancelado.');
    return;
  }

  switch (state.step) {
    case 'titulo':
      state.titulo = text.trim();
      state.step = 'tipo';
      cadastroMode.set(from, state);
      await whatsappService.sendText(from, 'Tipo do imóvel?\n1⃣ Casa\n2⃣ Apartamento\n3⃣ Terreno\n4⃣ Comercial');
      break;

    case 'tipo':
      const tipos = { '1': 'Casa', '2': 'Apartamento', '3': 'Terreno', '4': 'Comercial', 'casa': 'Casa', 'apartamento': 'Apartamento', 'terreno': 'Terreno', 'comercial': 'Comercial' };
      state.property_type = tipos[text.trim().toLowerCase()] || text.trim();
      state.step = 'oferta';
      cadastroMode.set(from, state);
      await whatsappService.sendText(from, 'Tipo de oferta?\n1⃣ Venda\n2⃣ Aluguel');
      break;

    case 'oferta':
      state.offer_type = text.trim().includes('1') || text.toLowerCase().includes('vend') ? 'compra' : 'aluguel';
      state.step = 'preco';
      cadastroMode.set(from, state);
      await whatsappService.sendText(from, ' Qual o valor? (Ex: 900000 ou 900 mil)');
      break;

    case 'preco':
      const precoText = text.toLowerCase();
      let val;
      if (precoText.match(/milh[oõã]/)) {
        val = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.')) * 1000000;
      } else if (precoText.match(/\bmil\b/) || precoText.includes('k')) {
        val = parseFloat(text.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) * 1000;
      } else {
        val = parseFloat(text.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
      }
      state.amount = val || 0;
      state.step = 'quartos';
      cadastroMode.set(from, state);
      await whatsappService.sendText(from, ' Quantos quartos?');
      break;

    case 'quartos':
      state.bedrooms = parseInt(text) || null;
      state.step = 'bairro';
      cadastroMode.set(from, state);
      await whatsappService.sendText(from, ' Qual o bairro/localização?');
      break;

    case 'bairro':
      state.neighborhood = text.trim();
      state.step = 'info';
      cadastroMode.set(from, state);
      await whatsappService.sendText(from, ' Informações adicionais?\n(Descreva: área, banheiros, vagas, condomínio, características especiais, etc.)\n\nOu digite *pular* para continuar sem.');
      break;

    case 'info':
      if (text.toLowerCase().trim() !== 'pular') {
        state.details = text.trim();
      }
      state.step = 'fotos';
      state.mediaFiles = [];
      cadastroMode.set(from, state);
      await whatsappService.sendText(from, ' Envie as fotos e/ou vídeos do imóvel.\n\nQuando terminar, digite *pronto*.');
      break;

    case 'fotos':
      if (text.toLowerCase().trim() === 'pronto') {
        const fotoCount = (state.mediaFiles || []).length;
        state.step = 'confirmar';
        cadastroMode.set(from, state);

        let resumo = ` *Confirme o cadastro:*\n\n ${state.titulo}\n ${state.neighborhood}\n ${state.property_type} - ${state.offer_type}\n R$ ${Number(state.amount).toLocaleString('pt-BR')}\n ${state.bedrooms || 'N/A'} quartos\n ${fotoCount} foto(s)/vídeo(s)`;
        if (state.details) resumo += `\n ${state.details.substring(0, 100)}${state.details.length > 100 ? '...' : ''}`;
        resumo += '\n\n Confirmar? (sim/não)';
        await whatsappService.sendText(from, resumo);
      } else {
        await whatsappService.sendText(from, ' Envie fotos/vídeos ou digite *pronto* para continuar.');
      }
      break;

    case 'confirmar':
      if (text.toLowerCase().includes('sim') || text.toLowerCase().includes('s')) {
        try {
          const cleanPhone = from.replace(/\D/g, '');
          const { data: corretor } = await supabase
            .from('corretores')
            .select('id')
            .or(`whatsapp.eq.${cleanPhone},whatsapp.eq.${from}`)
            .limit(1)
            .single();

          const serverUrl = (process.env.BASE_URL || 'https://socasatop.com.br') + '/uploads';
          const imageUrls = (state.mediaFiles || []).map(f => `${serverUrl}/${f}`);

          const imovelData = {
            titulo: state.titulo,
            property_type: state.property_type,
            offer_type: state.offer_type,
            amount: state.amount,
            bedrooms: state.bedrooms,
            neighborhood: state.neighborhood,
            details: state.details || null,
            corretor_id: corretor?.id || null,
            ativo: true,
            images: imageUrls,
          };

          // Try Supabase client first, fallback to curl
          let savedId = null;
          try {
            const { data, error } = await supabase.from('imoveis').insert(imovelData).select().single();
            if (!error && data) savedId = data.id;
          } catch (e) { /* fallback below */ }

          if (!savedId) {
            // Fallback: curl to Supabase REST API
            const { execSync } = require('child_process');
            const fs = require('fs');
            fs.writeFileSync('/tmp/imovel_insert.json', JSON.stringify(imovelData));
            const SUPABASE_IPS = ['104.18.38.10','172.64.149.246','162.159.141.245','162.159.143.245'];
            for (const ip of SUPABASE_IPS) {
              try {
                const cmd = `curl -4 -s --connect-timeout 3 --max-time 10 --connect-to ${process.env.SUPABASE_URL.replace('https://','').split('/')[0]}:443:${ip}:443 -X POST "${process.env.SUPABASE_URL}/rest/v1/imoveis" -H "apikey: ${process.env.SUPABASE_SECRET_KEY}" -H "Authorization: Bearer ${process.env.SUPABASE_SECRET_KEY}" -H "Content-Type: application/json" -H "Prefer: return=representation" -d @/tmp/imovel_insert.json 2>/dev/null`;
                const result = execSync(cmd, { encoding: 'utf-8', timeout: 15000 });
                if (result && result.trim()) {
                  const parsed = JSON.parse(result);
                  savedId = Array.isArray(parsed) ? parsed[0]?.id : parsed?.id;
                  if (savedId) break;
                }
              } catch (e) { /* try next IP */ }
            }
          }

          if (savedId) {
            await whatsappService.sendText(from, ` Imóvel cadastrado com sucesso!\n\nID: #${savedId}\n\nPara marcar como vendido, envie:\n"vendido ${savedId}"`);
          } else {
            await whatsappService.sendText(from, ' Erro temporário ao salvar. Tente novamente em alguns minutos.');
          }
        } catch (e) {
          await whatsappService.sendText(from, ' Erro temporário ao salvar. Tente novamente em alguns minutos.');
        }
      } else {
        await whatsappService.sendText(from, ' Cadastro cancelado.');
      }
      cadastroMode.delete(from);
      break;
  }
}

// === CADASTRO CORRETOR (ADM only) ===
async function handleCadastroCorretor(from, text) {
  const state = cadastroCorretorMode.get(from);
  const lower = text.toLowerCase().trim();

  // Cancel at any step
  if (lower === 'cancelar') {
    cadastroCorretorMode.delete(from);
    await whatsappService.sendText(from, ' Cadastro de corretor cancelado.');
    return;
  }

  switch (state.step) {
    case 'nome':
      state.nome = text.trim();
      state.step = 'whatsapp';
      cadastroCorretorMode.set(from, state);
      await whatsappService.sendText(from, ` Qual o WhatsApp do corretor *${state.nome}*?\n(Ex: 5561999998888)`);
      break;

    case 'whatsapp':
      state.whatsapp = text.replace(/\D/g, '');
      if (state.whatsapp.length < 10) {
        await whatsappService.sendText(from, ' Número inválido. Envie com DDD (Ex: 5561999998888)');
        return;
      }
      state.step = 'email';
      cadastroCorretorMode.set(from, state);
      await whatsappService.sendText(from, ' E-mail do corretor?\n(Ou digite *pular* para continuar sem)');
      break;

    case 'email':
      if (lower !== 'pular') {
        state.email = text.trim();
      }
      state.step = 'regiao';
      cadastroCorretorMode.set(from, state);
      await whatsappService.sendText(from, ' Região de atuação?\n(Ex: Lago Sul, Park Way, Jardim Botânico)');
      break;

    case 'regiao':
      state.regiao = text.trim();
      state.step = 'confirmar';
      cadastroCorretorMode.set(from, state);
      let resumo = ` *Confirme o cadastro do corretor:*\n\n`;
      resumo += ` Nome: ${state.nome}\n`;
      resumo += ` WhatsApp: ${state.whatsapp}\n`;
      if (state.email) resumo += ` E-mail: ${state.email}\n`;
      resumo += ` Região: ${state.regiao}\n`;
      resumo += `\n Confirmar? (sim/não)`;
      await whatsappService.sendText(from, resumo);
      break;

    case 'confirmar':
      if (lower.includes('sim') || lower === 's') {
        try {
          const corretorData = {
            nome: state.nome,
            whatsapp: state.whatsapp,
            email: state.email || null,
            regiao: state.regiao,
            ativo: true,
          };

          let savedId = null;
          try {
            const { data, error } = await supabase.from('corretores').insert(corretorData).select().single();
            if (!error && data) savedId = data.id;
          } catch (e) { /* fallback below */ }

          if (!savedId) {
            const { execSync } = require('child_process');
            const insertFs = require('fs');
            insertFs.writeFileSync('/tmp/corretor_insert.json', JSON.stringify(corretorData));
            const SUPABASE_IPS = ['104.18.38.10','172.64.149.246','162.159.141.245','162.159.143.245'];
            for (const ip of SUPABASE_IPS) {
              try {
                const host = process.env.SUPABASE_URL.replace('https://','').split('/')[0];
                const cmd = `curl -4 -s --connect-timeout 3 --max-time 10 --connect-to ${host}:443:${ip}:443 -X POST "${process.env.SUPABASE_URL}/rest/v1/corretores" -H "apikey: ${process.env.SUPABASE_SECRET_KEY}" -H "Authorization: Bearer ${process.env.SUPABASE_SECRET_KEY}" -H "Content-Type: application/json" -H "Prefer: return=representation" -d @/tmp/corretor_insert.json 2>/dev/null`;
                const result = execSync(cmd, { encoding: 'utf-8', timeout: 15000 });
                if (result && result.trim()) {
                  const parsed = JSON.parse(result);
                  savedId = Array.isArray(parsed) ? parsed[0]?.id : parsed?.id;
                  if (savedId) break;
                }
              } catch (e) { /* try next IP */ }
            }
          }

          if (savedId) {
            await whatsappService.sendText(from, ` Corretor *${state.nome}* cadastrado com sucesso!\n\nID: #${savedId}\nRegião: ${state.regiao}\nWhatsApp: ${state.whatsapp}`);
          } else {
            await whatsappService.sendText(from, ' Erro temporário ao salvar. Tente novamente em alguns minutos.');
          }
        } catch (e) {
          await whatsappService.sendText(from, ' Erro temporário ao salvar. Tente novamente em alguns minutos.');
        }
      } else {
        await whatsappService.sendText(from, ' Cadastro de corretor cancelado.');
      }
      cadastroCorretorMode.delete(from);
      break;
  }
}

// === MATCH PERCENTAGE ===
function calcMatchPercent(imovel, leadData) {
  let matched = 0;
  let total = 0;

  // Location match (most important)
  if (leadData.location) {
    total += 30;
    const loc = leadData.location.toLowerCase();
    const neighborhood = (imovel.neighborhood || '').toLowerCase();
    const location = (imovel.location || '').toLowerCase();
    if ((neighborhood && neighborhood.includes(loc)) || (location && location.includes(loc)) || (neighborhood && loc.includes(neighborhood)) || (location && loc.includes(location))) {
      matched += 30;
    }
  }

  // Property type match
  if (leadData.property_type) {
    total += 25;
    if (imovel.property_type && imovel.property_type.toLowerCase() === leadData.property_type.toLowerCase()) {
      matched += 25;
    }
  }

  // Bedrooms match
  if (leadData.bedrooms) {
    total += 20;
    if (imovel.bedrooms === leadData.bedrooms) {
      matched += 20;
    } else if (imovel.bedrooms && Math.abs(imovel.bedrooms - leadData.bedrooms) === 1) {
      matched += 10; // 1 quarto difference = half score
    }
  }

  // Price match (within ±25% range)
  if (leadData.budget && imovel.amount) {
    total += 25;
    const min = leadData.budget * 0.75;
    const max = leadData.budget * 1.25;
    const price = Number(imovel.amount);
    if (price >= min && price <= max) {
      // Closer to target = higher score
      const diff = Math.abs(price - leadData.budget) / leadData.budget;
      matched += Math.round(25 * (1 - diff));
    }
  }

  if (total === 0) return null;
  return Math.round((matched / total) * 100);
}

module.exports = { verify, receive };
