const instagramService = require('../services/instagram');
const aiService = require('../services/ai');
const leadsService = require('../services/leads');

const IG_PAGE_TOKEN = process.env.INSTAGRAM_PAGE_TOKEN;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN; // reuse same verify token

// Webhook verification (GET)
function verify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log(' Instagram webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
}

// Webhook handler (POST)
async function receive(req, res) {
  res.sendStatus(200); // respond immediately

  try {
    const body = req.body;
    console.log(' IG Webhook received:', JSON.stringify(body).substring(0, 500));

    if (body.object !== 'instagram' && body.object !== 'page') return;

    for (const entry of body.entry || []) {
      // Handle comment events
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            await handleComment(change.value);
          }
        }
      }

      // Handle DM (messaging) events
      if (entry.messaging) {
        for (const event of entry.messaging) {
          if (event.message && event.message.text) {
            await handleDM(event);
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro no Instagram webhook:', err.message);
  }
}

async function handleComment(commentData) {
  try {
    const commentId = commentData.id;
    const commentText = commentData.text;
    const from = commentData.from;

    if (!commentId || !commentText) return;

    console.log(` IG Comment [${from?.username || 'unknown'}]: ${commentText}`);

    // Generate AI reply for the comment
    const messages = [
      { role: 'system', content: getCommentSystemPrompt() },
      { role: 'user', content: commentText },
    ];
    const reply = await aiService.processMessage(messages, commentText);

    // Reply to the comment
    instagramService.replyToComment(commentId, reply, IG_PAGE_TOKEN);
    console.log(`↩ IG Reply: ${reply}`);

    // If the comment shows purchase intent, also send a DM
    const intent = detectIntent(commentText);
    if (intent && from?.id) {
      const dmText = `Oi! Vi seu comentário sobre ${intent}. Posso te ajudar a encontrar o imóvel ideal!  Qual região de Brasília te interessa?`;
      try {
        instagramService.sendDM(from.id, dmText, IG_PAGE_TOKEN);
        console.log(` IG DM sent to ${from?.username || from?.id}`);
      } catch (e) {
        console.log('DM not sent (user may not have messaged us):', e.message);
      }
    }
  } catch (err) {
    console.error('Erro ao processar comentário IG:', err.message);
  }
}

async function handleDM(event) {
  try {
    const senderId = event.sender.id;
    const messageText = event.message.text;

    console.log(` IG DM [${senderId}]: ${messageText}`);

    // Get or create lead
    let lead = await leadsService.buscarPorWhatsapp(senderId);
    if (!lead) {
      lead = await leadsService.criarLead({
        whatsapp: senderId,
        canal: 'instagram',
        status: 'novo',
      });
    }

    // Get conversation history
    const historico = await leadsService.getHistorico(lead.id, 10);
    const messages = [
      { role: 'system', content: getDMSystemPrompt() },
      ...historico.map(m => ({
        role: m.direcao === 'entrada' ? 'user' : 'assistant',
        content: m.mensagem,
      })),
      { role: 'user', content: messageText },
    ];

    // Save incoming message
    await leadsService.salvarInteracao({
      lead_id: lead.id,
      canal: 'instagram',
      direcao: 'entrada',
      mensagem: messageText,
    });

    // Generate AI response
    const resposta = await aiService.processMessage(messages, messageText);

    // Send DM reply
    instagramService.sendDM(senderId, resposta, IG_PAGE_TOKEN);
    console.log(`↩ IG DM Reply: ${resposta}`);

    // Save outgoing message
    await leadsService.salvarInteracao({
      lead_id: lead.id,
      canal: 'instagram',
      direcao: 'saida',
      mensagem: resposta,
    });

    // Extract lead data for qualification
    const leadData = aiService.extractLeadData([...historico.map(m => ({
      role: m.direcao === 'entrada' ? 'user' : 'assistant',
      content: m.mensagem,
    })), { role: 'user', content: messageText }]);

    if (leadData.offer_type || leadData.property_type || leadData.budget) {
      await leadsService.atualizarLead(lead.id, {
        offer_type: leadData.offer_type || lead.offer_type,
        regiao: leadData.location || lead.regiao,
        budget_max: leadData.budget || lead.budget_max,
        bedrooms: leadData.bedrooms || lead.bedrooms,
      });

      // Suggest moving to WhatsApp for property cards
      if (leadData.offer_type && leadData.budget) {
        const whatsappMsg = `Encontrei algumas opções que podem te interessar! Para te enviar as fotos e detalhes dos imóveis, posso continuar a conversa pelo WhatsApp? Nosso número é +55 61 8413-6152 `;
        instagramService.sendDM(senderId, whatsappMsg, IG_PAGE_TOKEN);
      }
    }
  } catch (err) {
    console.error('Erro ao processar DM IG:', err.message);
  }
}

function getCommentSystemPrompt() {
  return `Você é o assistente da imobiliária Só Casa Top em Brasília.
Responda comentários do Instagram de forma curta, simpática e profissional.
Máximo 2 frases. Use emojis com moderação.
Se o comentário mostrar interesse em imóvel, convide para DM.
Responda em português brasileiro.`;
}

function getDMSystemPrompt() {
  return `Você é um assistente virtual da imobiliária Só Casa Top, especializada em imóveis em Brasília, Brasil.

Seu papel é atender clientes via Instagram Direct de forma simpática, profissional e objetiva.

Regras:
- Sempre responda em português brasileiro
- Faça perguntas para qualificar: tipo (casa/apto), região, orçamento, quartos
- Quando tiver informações suficientes, sugira continuar pelo WhatsApp para enviar fotos
- Não invente imóveis, diga que vai buscar opções
- Máximo 3 frases por resposta
- Use emojis com moderação`;
}

function detectIntent(text) {
  const lower = text.toLowerCase();
  if (lower.includes('compr') || lower.includes('vend')) return 'compra de imóvel';
  if (lower.includes('alug')) return 'aluguel';
  if (lower.includes('casa') || lower.includes('apto') || lower.includes('apartamento')) return 'imóveis';
  if (lower.includes('preço') || lower.includes('valor') || lower.includes('quanto')) return 'preços';
  return null;
}

module.exports = { verify, receive };
