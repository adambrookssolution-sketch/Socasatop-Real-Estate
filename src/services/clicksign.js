const axios = require('axios');

const CLICKSIGN_TOKEN = process.env.CLICKSIGN_TOKEN || '';
const CLICKSIGN_API = process.env.CLICKSIGN_API || 'https://app.clicksign.com';

function isConfigured() {
  return !!CLICKSIGN_TOKEN;
}

async function criarDocumento({ nome, conteudoBase64, mimetype }) {
  if (!isConfigured()) throw new Error('ClickSign nao configurado. Defina CLICKSIGN_TOKEN no .env');

  const url = CLICKSIGN_API + '/api/v1/documents?access_token=' + CLICKSIGN_TOKEN;
  const body = {
    document: {
      path: '/' + nome,
      content_base64: 'data:' + (mimetype || 'application/pdf') + ';base64,' + conteudoBase64,
      deadline_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      auto_close: true,
      locale: 'pt-BR',
      sequence_enabled: false,
      remind_interval: '3',
    },
  };

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
    validateStatus: () => true,
  });
  if (response.status >= 400) {
    throw new Error('ClickSign error: ' + JSON.stringify(response.data).substring(0, 300));
  }
  return response.data.document;
}

async function adicionarSignatario({ documentKey, nome, email, whatsapp, cpf, dataNascimento }) {
  if (!isConfigured()) throw new Error('ClickSign nao configurado');

  const url = CLICKSIGN_API + '/api/v1/signers?access_token=' + CLICKSIGN_TOKEN;
  const body = {
    signer: {
      email: email,
      phone_number: whatsapp,
      auths: ['email'],
      name: nome,
      documentation: cpf,
      birthday: dataNascimento || '1980-01-01',
      has_documentation: !!cpf,
    },
  };
  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
    validateStatus: () => true,
  });
  if (response.status >= 400) {
    throw new Error('ClickSign signer error: ' + JSON.stringify(response.data).substring(0, 300));
  }
  return response.data.signer;
}

async function vincularSignatario({ documentKey, signerKey, signAs }) {
  if (!isConfigured()) throw new Error('ClickSign nao configurado');

  const url = CLICKSIGN_API + '/api/v1/lists?access_token=' + CLICKSIGN_TOKEN;
  const body = {
    list: {
      document_key: documentKey,
      signer_key: signerKey,
      sign_as: signAs || 'contractor',
      message: 'Por favor assine o contrato de parceria So Casa Top.',
    },
  };
  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
    validateStatus: () => true,
  });
  if (response.status >= 400) {
    throw new Error('ClickSign vincular error: ' + JSON.stringify(response.data).substring(0, 300));
  }
  return response.data.list;
}

async function getDocumento(documentKey) {
  if (!isConfigured()) throw new Error('ClickSign nao configurado');
  const url = CLICKSIGN_API + '/api/v1/documents/' + documentKey + '?access_token=' + CLICKSIGN_TOKEN;
  const response = await axios.get(url, { timeout: 30000, validateStatus: () => true });
  if (response.status >= 400) throw new Error('ClickSign get error: ' + response.status);
  return response.data.document;
}

function gerarContratoBase64({ nome, cpf, regiao, valor }) {
  const conteudo = `CONTRATO DE PARCERIA - SO CASA TOP

Parte 1: SO CASA TOP IMOVEIS
Parte 2: ${nome}
CPF/CNPJ: ${cpf || '(nao informado)'}
Regiao: ${regiao}
Valor da assinatura mensal: R$ ${valor.toFixed(2).replace('.', ',')}

Este contrato firma a parceria entre as partes nos termos abaixo:

1. O parceiro tera acesso a plataforma So Casa Top na regiao designada.
2. Limite de 5 parceiros por regiao.
3. Periodo de 21 dias gratuitos. Apos esse periodo, sera cobrada a mensalidade automaticamente.
4. O cancelamento pode ser feito a qualquer momento.
5. As regras gerais da plataforma se aplicam.

Data: ${new Date().toLocaleDateString('pt-BR')}

Assinaturas pelas partes via ClickSign.
`;
  return Buffer.from(conteudo, 'utf-8').toString('base64');
}

module.exports = {
  isConfigured,
  criarDocumento,
  adicionarSignatario,
  vincularSignatario,
  getDocumento,
  gerarContratoBase64,
};
