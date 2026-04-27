const aiService = require('./ai');

const SYSTEM_DESCRICAO = `Voce e um copywriter especializado em imoveis de alto padrao em Brasilia. Reescreve descricoes de imoveis seguindo o padrao So Casa Top:
- Tom sofisticado, sem clicheis
- Destaca diferenciais reais (vista, arquitetura, localizacao)
- Usa portugues brasileiro fluido
- Evita superlativos genericos
- Estrutura: paragrafo de abertura forte, lista de destaques, paragrafo de localizacao, fechamento
- Maximo 1500 caracteres
- Foca no que diferencia este imovel especifico`;

async function reescreverDescricao(imovel) {
  const promptUser = `Reescreva a descricao deste imovel mantendo todos os fatos verificaveis (metragem, quartos, vagas, acabamentos mencionados). Nao invente dados que nao estao na descricao original.

DADOS DO IMOVEL:
- Titulo: ${imovel.titulo || ''}
- Bairro: ${imovel.neighborhood || ''}
- Localizacao: ${imovel.location || ''}
- Tipo: ${imovel.property_type || ''}
- Quartos: ${imovel.bedrooms || 'nao informado'}
- Area: ${imovel.size ? imovel.size + ' m2' : 'nao informada'}
- Preco: ${imovel.amount ? 'R$ ' + Number(imovel.amount).toLocaleString('pt-BR') : 'sob consulta'}

DESCRICAO ATUAL:
${imovel.details || '(sem descricao)'}

Retorne APENAS o novo texto da descricao, sem cabecalhos nem explicacoes.`;

  const novoTexto = await aiService.rawCompletion(promptUser, {
    system: SYSTEM_DESCRICAO,
    max_tokens: 800,
    temperature: 0.4,
  });

  return novoTexto.trim();
}

async function gerarTituloPadronizado(imovel) {
  const prompt = `Gere um titulo padronizado para este imovel no formato: "[Tipo] [Nome curto] - [Quadra/Setor], [Bairro]"

Exemplos:
- "Casa Lago Sul, Qi 15"
- "Apartamento Gerbera - QI 11, Lago Sul"
- "Casa Atena - QD 5, Arniqueira"

DADOS:
- Tipo: ${imovel.property_type || 'Casa'}
- Bairro: ${imovel.neighborhood || ''}
- Endereco/Quadra: ${imovel.street || imovel.location || ''}
- Titulo atual: ${imovel.titulo || ''}

Retorne APENAS o novo titulo, sem aspas nem explicacoes. Maximo 60 caracteres.`;

  const titulo = await aiService.rawCompletion(prompt, {
    max_tokens: 80,
    temperature: 0.2,
    system: 'Responda apenas o texto puro do titulo, sem aspas, sem JSON, sem markdown, sem explicacoes.',
  });

  let cleaned = titulo.trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object' && parsed.titulo) cleaned = parsed.titulo;
    else if (typeof parsed === 'string') cleaned = parsed;
  } catch (e) { /* not JSON, use as is */ }
  cleaned = cleaned.replace(/^["']|["']$/g, '').replace(/\\"/g, '"').trim();
  return cleaned.substring(0, 60);
}

async function destacarDiferenciais(imovel) {
  const prompt = `Analise a descricao deste imovel e extraia ate 5 diferenciais reais como bullets curtos (maximo 50 caracteres cada).

Procure por:
- Vista privilegiada (lago, cidade, verde)
- Itens de luxo (piscina, spa, cinema, sauna)
- Arquitetura assinada
- Sustentabilidade (energia solar)
- Tecnologia (automacao)
- Localizacao premium

DESCRICAO:
${imovel.details || ''}

Retorne uma lista JSON de strings.

Apenas o JSON valido, sem markdown.`;

  try {
    const resp = await aiService.rawCompletion(prompt, {
      max_tokens: 400,
      temperature: 0.3,
    });
    const cleaned = resp.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const arr = JSON.parse(cleaned);
    if (Array.isArray(arr)) return arr.slice(0, 5).map(s => String(s).substring(0, 60));
  } catch (e) { /* ignore */ }
  return [];
}

async function curarDescricaoCompleta(imovel) {
  const [novaDescricao, novoTitulo, destaques] = await Promise.all([
    reescreverDescricao(imovel),
    gerarTituloPadronizado(imovel),
    destacarDiferenciais(imovel),
  ]);

  return {
    descricao_nova: novaDescricao,
    titulo_novo: novoTitulo,
    destaques: destaques,
    versao_anterior: {
      titulo: imovel.titulo,
      details: imovel.details,
    },
    versao_nova: {
      titulo: novoTitulo,
      details: novaDescricao,
      destaques: destaques,
    },
  };
}

module.exports = {
  reescreverDescricao,
  gerarTituloPadronizado,
  destacarDiferenciais,
  curarDescricaoCompleta,
};
