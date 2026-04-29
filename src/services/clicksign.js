const axios = require('axios');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const LOGO_PATH = path.resolve(__dirname, '..', '..', 'public', 'img', 'logo.png');

const CLICKSIGN_TOKEN = process.env.CLICKSIGN_TOKEN || '';
const CLICKSIGN_API = process.env.CLICKSIGN_API || 'https://app.clicksign.com';

const EMPRESA = {
  razao_social: process.env.EMPRESA_RAZAO_SOCIAL || 'So Casa Top Marketing e Negocios Imobiliarios Ltda',
  cnpj: process.env.EMPRESA_CNPJ || '39.938.529/0001-96',
  endereco: process.env.EMPRESA_ENDERECO || 'Rua 9 Norte, Lote 5, Numero 5/6, Aguas Claras, Brasilia - DF, CEP 71908-540',
  prazo_pagamento: process.env.EMPRESA_PRAZO_PAGAMENTO || 'todo dia 10 de cada mes',
};

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

function gerarContratoPdfBuffer({ nome, cpf, regioes, valor }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const regioesStr = Array.isArray(regioes) ? regioes.join(', ') : (regioes || 'N/A');
    const valorStr = 'R$ ' + Number(valor || 0).toFixed(2).replace('.', ',');
    const hoje = new Date().toLocaleDateString('pt-BR');

    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, { fit: [120, 60], align: 'center' });
        doc.moveDown(0.5);
      } catch (e) { /* skip logo on error */ }
    }
    doc.font('Helvetica-Bold').fontSize(16).text('CONTRATO DE PARCERIA - SO CASA TOP', { align: 'center' });
    doc.moveDown(1.5);

    doc.font('Helvetica-Bold').fontSize(11).text('CONTRATANTE:');
    doc.font('Helvetica').fontSize(10);
    doc.text(EMPRESA.razao_social);
    doc.text('CNPJ: ' + EMPRESA.cnpj);
    doc.text('Endereco: ' + EMPRESA.endereco);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(11).text('CONTRATADO (PARCEIRO):');
    doc.font('Helvetica').fontSize(10);
    doc.text('Nome: ' + (nome || '(nao informado)'));
    doc.text('CPF/CNPJ: ' + (cpf || '(nao informado)'));
    doc.text('Regiao(oes) de atuacao: ' + regioesStr);
    doc.text('Valor mensal: ' + valorStr);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(11).text('CLAUSULAS:');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);

    const clausulas = [
      '1. OBJETO. O CONTRATANTE concede ao CONTRATADO acesso a plataforma So Casa Top, com direito de atuacao na(s) regiao(oes) acima indicada(s), em regime de exclusividade limitada (maximo de 5 parceiros por regiao).',
      '2. PERIODO DE TESTE. O CONTRATADO usufruira de 21 (vinte e um) dias gratuitos a contar da assinatura deste contrato. Apos esse periodo, o cartao de credito cadastrado sera cobrado automaticamente, ' + EMPRESA.prazo_pagamento + ', no valor de ' + valorStr + '.',
      '3. VALIDACAO DE CARTAO. No ato do cadastro do meio de pagamento, podera ser efetuada uma cobranca simbolica de R$ 0,01 (um centavo), imediatamente cancelada, com o unico proposito de validar a autenticidade do cartao.',
      '4. CANCELAMENTO. O CONTRATADO pode cancelar a assinatura a qualquer momento sem multa, com efeitos a partir do proximo ciclo de cobranca.',
      '5. INADIMPLENCIA. O nao pagamento por 7 (sete) dias suspende o acesso a plataforma. Apos 30 (trinta) dias de inadimplencia, a vaga e liberada para outro parceiro.',
      '6. DIREITOS DE USO. O CONTRATADO recebe leads gerados na regiao, acesso a IA de curadoria de imoveis, e divulgacao por canais oficiais da plataforma.',
      '7. CONDUTA. O CONTRATADO compromete-se a tratar leads com profissionalismo, manter dados atualizados e respeitar as politicas da plataforma.',
      '8. PROTECAO DE DADOS. As partes se comprometem ao cumprimento da LGPD (Lei 13.709/2018).',
      '9. FORO. Fica eleito o foro da comarca de Brasilia-DF para dirimir quaisquer questoes oriundas deste contrato.',
    ];
    for (const cl of clausulas) {
      doc.text(cl, { align: 'justify' });
      doc.moveDown(0.4);
    }

    doc.moveDown(1.5);
    doc.text('Brasilia-DF, ' + hoje + '.');
    doc.moveDown(1);
    doc.text('Assinaturas pelas partes via ClickSign (assinatura digital com validade juridica - MP 2.200-2/2001).');

    doc.end();
  });
}

async function gerarContratoBase64(args) {
  const buf = await gerarContratoPdfBuffer(args);
  return buf.toString('base64');
}

module.exports = {
  isConfigured,
  criarDocumento,
  adicionarSignatario,
  vincularSignatario,
  getDocumento,
  gerarContratoBase64,
  gerarContratoPdfBuffer,
  EMPRESA,
};
