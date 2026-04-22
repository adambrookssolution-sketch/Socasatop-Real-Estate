const { execSync } = require('child_process');

const SYSTEM_PROMPT = `Você é a assistente virtual da Só Casa Top, especializada em imóveis de alto padrão em Brasília.

Sua personalidade:
- Simpática, acolhedora e profissional — como uma consultora de imóveis experiente
- Conversa de forma natural e fluida, nunca robótica
- Demonstra interesse genuíno pelo que o cliente busca
- Usa emojis com moderação (1-2 por mensagem, não mais)

Fluxo de atendimento:
1. Se o cliente já informar dados (tipo, localização, quartos, valor), confirme com entusiasmo e diga que vai buscar.
2. Se faltar informação, pergunte de forma natural e conversacional (não como formulário).
3. Se o cliente mudar critérios, aceite com naturalidade.

Regras de conversa:
- Responda SEMPRE em português brasileiro
- Seja calorosa mas concisa (2-3 frases, nunca mais de 4)
- SEMPRE termine com uma sugestão de próxima ação ou pergunta que convide resposta. Exemplos:
  • "Quer que eu busque em outra região também?"
  • "Posso filtrar por número de quartos, se preferir!"
  • "Gostou de algum? Posso te conectar com o corretor responsável "
  • "Quer ver opções em outra faixa de preço?"
- NUNCA diga "um corretor entrará em contato"
- Quando tiver dados suficientes para buscar (tipo + localização OU tipo + valor), responda com entusiasmo: "Que ótimo! Vou buscar as melhores opções pra você! "
- Depois que enviar resultados, o sistema automaticamente adiciona as opções. Sua próxima mensagem deve oferecer ajuda adicional.
- Se o cliente mandar algo fora do contexto imobiliário (perguntas gerais, clima, curiosidades, etc), responda APENAS: "Eu sou especialista em imóveis de alto padrão em Brasília!  Posso te ajudar a encontrar a casa ou apartamento ideal. O que você procura?" — NÃO responda a pergunta fora do contexto, NÃO demonstre conhecimento sobre outros assuntos
- Se o cliente mencionar um imóvel específico (com ID ou nome), mostre interesse: "Ótima escolha! Vou puxar os detalhes pra você."

Dados que extraímos:
- offer_type: compra ou aluguel
- property_type: casa, apartamento, terreno, comercial
- neighborhood/location: bairro
- max_budget: valor máximo
- bedrooms: quartos (opcional)`;

async function processMessage(conversation, newMessage) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversation,
    { role: 'user', content: newMessage },
  ];

  const payload = JSON.stringify({
    model: 'gpt-4o',
    messages,
    max_tokens: 400,
    temperature: 0.7,
  });

  const payloadFile = '/tmp/openai_payload.json';
  require('fs').writeFileSync(payloadFile, payload);

  const cmd = `curl -s --connect-timeout 5 --max-time 30 -X POST "https://api.openai.com/v1/chat/completions" -H "Authorization: Bearer ${process.env.OPENAI_API_KEY}" -H "Content-Type: application/json" -d @${payloadFile} 2>/dev/null`;
  let result = '';
  try {
    result = execSync(cmd, { encoding: 'utf-8', timeout: 35000, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    result = e.stdout || '';
  }

  if (!result || !result.trim()) throw new Error('OpenAI request failed - empty response');
  const data = JSON.parse(result);
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

function extractLeadData(conversation) {
  const allText = conversation.map(m => m.content).join(' ').toLowerCase();
  const userMsgs = conversation.filter(m => m.role === 'user');
  const lastUserMsg = userMsgs[userMsgs.length - 1];
  const lastUserText = lastUserMsg ? lastUserMsg.content.toLowerCase() : '';
  const prevUserMsg = userMsgs[userMsgs.length - 2];
  const prevUserText = prevUserMsg ? prevUserMsg.content.toLowerCase() : '';

  // Detect if last message has a NEW location (user is changing search context)
  const locationList = [
    'lago sul', 'lago norte', 'park way', 'parkway', 'vicente pires',
    'arniqueira', 'águas claras', 'aguas claras', 'taguatinga', 'ceilândia',
    'samambaia', 'guará', 'guara', 'sudoeste', 'noroeste', 'asa sul',
    'asa norte', 'cruzeiro', 'octogonal', 'jardim botânico', 'jardim botanico',
    'sobradinho', 'planaltina', 'gama', 'santa maria', 'riacho fundo',
    'recanto das emas', 'mangueiral', 'jardim mangueiral', 'alto da boa vista',
    'setor habitacional', 'condomínio', 'shi', 'shis', 'smpw', 'smdb',
  ];
  let lastMsgHasNewLocation = false;
  for (const loc of locationList) {
    if (lastUserText.includes(loc)) { lastMsgHasNewLocation = true; break; }
  }

  // Detect if it's a "continuation" (e.g. "E no Park Way?") vs a "new search" (e.g. "Casa em Arniqueira")
  // Continuation: short message with just location change, keep previous filters
  // New search: has new property_type or explicit new criteria, reset filters
  const isContinuation = lastMsgHasNewLocation && (
    lastUserText.match(/^e\s+(no|na|em|pro|pra)\s/i) ||
    lastUserText.match(/^(também|tb|tamb[eé]m)\b/i) ||
    lastUserText.match(/^(tem|e)\s/i)
  );
  const isNewSearch = lastMsgHasNewLocation && !isContinuation;

  // Context text: for continuation use only prev+last user msgs, for new search use only last, otherwise full
  const text = isContinuation ? (prevUserText + ' ' + lastUserText) : isNewSearch ? lastUserText : allText;

  // Extract offer type from LAST user message first, then full conversation
  let offerType = null;
  if (lastUserText.includes('compr') || lastUserText.includes('vend')) offerType = 'compra';
  else if (lastUserText.includes('alug')) offerType = 'aluguel';
  else if (!isNewSearch) {
    if (text.includes('compr') || text.includes('vend')) offerType = 'compra';
    else if (text.includes('alug')) offerType = 'aluguel';
  }

  // Property type - last user message first, then recent user messages (not full allText)
  function detectPropertyType(t) {
    if (t.includes('apartamento')) return 'Apartamento';
    if (t.includes('terreno')) return 'Terreno';
    if (t.includes('comercial') || t.includes('loja')) return 'Comercial';
    if (t.includes('casa')) return 'Casa';
    return null;
  }
  let propertyType = detectPropertyType(lastUserText);
  if (!propertyType) {
    // Check recent user messages in reverse order (most recent first)
    for (let i = userMsgs.length - 2; i >= 0 && i >= userMsgs.length - 4; i--) {
      const pt = detectPropertyType(userMsgs[i].content.toLowerCase());
      if (pt) { propertyType = pt; break; }
    }
  }
  if (!propertyType) propertyType = detectPropertyType(text);

  // Bedrooms - if new search reset, if continuation keep previous
  const lastBedroomsMatch = lastUserText.match(/(\d+)\s*(?:quarto|dormit)/);
  const bedroomsMatch = isNewSearch ? lastBedroomsMatch : (lastBedroomsMatch || text.match(/(\d+)\s*(?:quarto|dormit)/));
  const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : null;

  // Match budget - last user message first; if new location without budget, reset
  let budget = null;
  const budgetPatterns = [
    /(?:até|at[eé])\s*(?:r\$\s*)?(\d[\d.,]*)\s*(?:milh[oõ]|milh[aã]o)/i,
    /(?:até|at[eé])\s*(?:r\$\s*)?(\d[\d.,]*)\s*(?:mil|k)/i,
    /(?:até|at[eé])\s*(?:r\$\s*)?(\d[\d.,]+)\b/i,
    /(?:r\$\s*)(\d[\d.,]*)\s*(?:milh[oõ]|milh[aã]o)/i,
    /(?:r\$\s*)(\d[\d.,]*)\s*(?:mil|k)/i,
    /(\d[\d.,]*)\s*(?:milh[oõ]|milh[aã]o)/i,
    /(\d[\d.,]*)\s*mil\b/i,
  ];
  const textsToTry = isNewSearch ? [lastUserText] : [lastUserText, text];
  for (const searchText of textsToTry) {
    if (budget) break;
    for (const pattern of budgetPatterns) {
      const m = searchText.match(pattern);
    if (m) {
      let raw = m[1];
      let val;
      if (/milh/i.test(m[0])) {
        val = parseFloat(raw.replace(',', '.')) * 1000000;
      } else {
        val = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
        if (/mil\b|k/i.test(m[0])) val *= 1000;
      }
      if (val >= 50000) { budget = val; break; }
    }
    }
  }

  // Extract location - prioritize LAST user message, then full conversation
  let location = null;
  for (const loc of locationList) {
    if (lastUserText.includes(loc)) {
      location = loc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }
  if (!location) {
    for (const loc of locationList) {
      if (text.includes(loc)) {
        location = loc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }
  }

  // Default: if budget > 50000 and no offer_type specified, assume 'compra' (not aluguel)
  if (!offerType && budget && budget > 50000) offerType = 'compra';

  return { offer_type: offerType, property_type: propertyType, bedrooms, budget, location };
}

async function rawCompletion(prompt, opts = {}) {
  const payload = JSON.stringify({
    model: opts.model || 'gpt-4o',
    messages: [
      { role: 'system', content: opts.system || 'Responda apenas com JSON valido, sem explicacoes nem markdown.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: opts.max_tokens || 1500,
    temperature: opts.temperature != null ? opts.temperature : 0.3,
  });

  const payloadFile = '/tmp/openai_raw_payload.json';
  require('fs').writeFileSync(payloadFile, payload);

  const cmd = `curl -s --connect-timeout 5 --max-time 60 -X POST "https://api.openai.com/v1/chat/completions" -H "Authorization: Bearer ${process.env.OPENAI_API_KEY}" -H "Content-Type: application/json" -d @${payloadFile} 2>/dev/null`;
  let result = '';
  try {
    result = execSync(cmd, { encoding: 'utf-8', timeout: 65000, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    result = e.stdout || '';
  }

  if (!result || !result.trim()) throw new Error('OpenAI request failed');
  const data = JSON.parse(result);
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

module.exports = { processMessage, extractLeadData, rawCompletion };
