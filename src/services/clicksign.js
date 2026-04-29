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
  representante: process.env.EMPRESA_REPRESENTANTE || 'Sabrina do Amaral Soares Ramos',
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

function gerarContratoPdfBuffer({ nome, cpf, regioes, valor, creci, endereco, representante_nome, representante_cpf, tipo_pessoa }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const regioesStr = Array.isArray(regioes) ? regioes.join(', ') : (regioes || 'N/A');
    const valorStr = 'R$ ' + Number(valor || 0).toFixed(2).replace('.', ',');
    const cpfClean = (cpf || '').replace(/\D/g, '');
    const isPJ = tipo_pessoa === 'PJ' || cpfClean.length === 14;
    const tipoStr = isPJ ? 'pessoa juridica' : 'pessoa fisica';
    const docLabel = isPJ ? 'CNPJ' : 'CPF';
    const hoje = new Date().toLocaleDateString('pt-BR');

    function H1(t) { doc.font('Helvetica-Bold').fontSize(15).text(t, { align: 'center' }); doc.moveDown(0.8); }
    function H2(t) { doc.font('Helvetica-Bold').fontSize(11).text(t); doc.moveDown(0.3); }
    function P(t) { doc.font('Helvetica').fontSize(10).text(t, { align: 'justify' }); doc.moveDown(0.35); }
    function Bullet(t) { doc.font('Helvetica').fontSize(10).text('  - ' + t, { align: 'justify' }); doc.moveDown(0.2); }

    if (fs.existsSync(LOGO_PATH)) {
      try { doc.image(LOGO_PATH, { fit: [110, 55], align: 'center' }); doc.moveDown(0.5); } catch (e) { /* skip */ }
    }
    H1('SO CASA TOP');
    H1('CONTRATO DE PARCERIA COMERCIAL E ADESAO AO PROGRAMA FUNDADORES');

    H2('Quadro-resumo comercial');
    P('Programa: Parceiros Fundadores So Casa Top.');
    P('Valor mensal fundador: R$ 497,00 por mes por regiao, enquanto permanecer ativo e adimplente.');
    P('Valor contratado: ' + valorStr + ' (' + (Array.isArray(regioes) ? regioes.length : 1) + ' regiao(oes): ' + regioesStr + ').');
    P('Experiencia inicial: 21 dias de experiencia, sem barreira de saida.');
    P('Fidelidade: sem fidelidade. Cancelamento a qualquer momento.');
    P('Limite por regiao: ate 5 parceiros por regiao.');
    P('Lago Sul: regiao encerrada nesta fase.');
    P('Requisitos minimos: carteira recomendada de 30 imoveis acima de R$ 1.500.000,00 e comissao minima de 4%.');
    P('Comissao sobre vendas: entre 15% e 25% da comissao liquida do parceiro, conforme performance.');
    P('Validacao de cartao: pre-autorizacao simbolica de R$ 0,01 imediatamente cancelada, apenas para validar.');
    doc.moveDown(0.5);

    H2('1. Partes');
    P('CONTRATANTE: ' + EMPRESA.razao_social + ', ' + tipoStr + ' de direito privado, inscrita no CNPJ sob no ' + EMPRESA.cnpj + ', com sede em ' + EMPRESA.endereco + ', neste ato representada por ' + EMPRESA.representante + ', doravante denominada "SO CASA TOP".');
    var parceiroLine = 'CONTRATADO (PARCEIRO): ' + (nome || '(nao informado)') + ', ' + tipoStr + ', inscrito no ' + docLabel + ' sob no ' + (cpf || '(nao informado)') + (creci ? ', CRECI no ' + creci : '') + (endereco ? ', com endereco em ' + endereco : '') + '.';
    P(parceiroLine);
    if (isPJ && representante_nome) {
      P('Representante legal do PARCEIRO: ' + representante_nome + (representante_cpf ? ', CPF no ' + representante_cpf : '') + '.');
    }
    P('Quando o PARCEIRO for pessoa juridica, devera indicar o responsavel operacional, os corretores vinculados, os dados bancarios, a regularidade de CRECI e os contatos oficiais para comunicacao.');

    H2('2. Objeto do contrato');
    P('Adesao do PARCEIRO a plataforma e ecossistema comercial do SO CASA TOP, voltado a geracao, qualificacao, organizacao, distribuicao e acompanhamento de oportunidades de negocio relacionadas a imoveis de alto padrao, especialmente imoveis com valor anunciado igual ou superior a R$ 1.500.000,00.');
    P('A parceria podera compreender: exposicao de imoveis, recebimento e distribuicao de leads, pre-qualificacao por inteligencia artificial, registro de origem do lead, acompanhamento de funil, suporte a curadoria, integracao com WhatsApp, area do parceiro, relatorios de performance e demais recursos liberados gradualmente.');
    P('O contrato nao garante venda, proposta, visita, volume minimo de leads, exclusividade absoluta de clientes, nem resultado financeiro especifico.');

    H2('3. Programa Fundadores e preco promocional');
    P('Mensalidade promocional de R$ 497,00 por regiao, enquanto mantiver a adesao ativa, adimplente e em conformidade com este contrato. Condicao especial, pessoal e vinculada a fase inicial. Valores futuros poderao ser superiores (R$ 997, R$ 1.497, R$ 2.000 ou outros). Inadimplencia, fraude, bypass ou descumprimento poderao acarretar perda da condicao de fundador.');

    H2('4. Experiencia de 21 dias e ausencia de barreira de saida');
    P('21 dias corridos de experiencia inicial contados da ativacao do acesso, assinatura eletronica ou liberacao operacional, o que ocorrer por ultimo. Durante e apos os 21 dias, o PARCEIRO podera cancelar a qualquer momento sem multa de fidelidade. O cancelamento nao afasta valores ja vencidos, comissoes devidas, deveres de confidencialidade, obrigacoes de LGPD e dever de nao burlar a origem do lead.');

    H2('5. Sem fidelidade');
    P('Sem fidelidade minima. Recomenda-se aviso previo de 7 dias corridos para organizacao operacional. O SO CASA TOP tambem podera encerrar a parceria em caso de fraude, bypass, uso indevido de leads, violacao de confidencialidade, inadimplencia, descumprimento de requisitos minimos, danos a marca ou baixa performance persistente.');

    H2('6. Limitacao por regiao, disponibilidade e Lago Sul');
    P('Limite de ate 5 parceiros por regiao. Lago Sul encerrada nesta fase. Reserva depende de aceite contratual, pagamento, validacao de requisitos minimos e aprovacao operacional. O SO CASA TOP podera redefinir regioes, sub-regioes, criterios e quantidade, respeitados os direitos ja constituidos sobre leads registrados.');

    H2('7. Requisitos minimos de entrada e manutencao');
    P('Carteira minima recomendada de 30 imoveis aptos a comercializacao com valor igual ou superior a R$ 1.500.000,00 e comissao minima de venda de 4%. O SO CASA TOP podera solicitar comprovacao documental, autorizacao de divulgacao, fotos, videos, matricula, IPTU, certidoes, dados do proprietario e regularidade de captacao. Imoveis sem documentacao minima ou com risco reputacional poderao ser recusados, ocultados, pausados ou enviados para curadoria.');

    H2('8. Comissao variavel sobre venda efetivamente realizada');
    P('Alem da mensalidade, o SO CASA TOP fara jus a participacao sobre a comissao imobiliaria efetivamente recebida pelo PARCEIRO em negocios originados, influenciados, registrados ou atribuidos a plataforma.');
    P('A participacao variara entre 15% e 25% da comissao liquida do PARCEIRO, conforme performance, aderencia ao processo, SLA, atualizacao do funil e taxa de conversao. Quanto maior a performance, menor tende a ser a participacao do SO CASA TOP.');
    P('Regua sugerida: (i) Alta performance: 15%; (ii) Intermediaria: 20%; (iii) Em desenvolvimento: 25%. Comissao devida apenas quando houver venda efetivamente concretizada e comissao recebida pelo PARCEIRO, salvo fraude ou bypass.');

    H2('9. Criterios de atribuicao do lead e carimbo de origem');
    P('Todo lead gerado ou captado por canais do SO CASA TOP recebera registro de origem, identificador unico, carimbo, protocolo, data, hora, regiao, imovel de interesse, faixa de preco e canal de entrada.');
    P('O lead permanecera atribuido ao SO CASA TOP pelo prazo de ate 12 meses contados do primeiro registro. Dentro desse periodo, qualquer compra envolvendo o lead, conjuge, empresa, familiar direto, representante ou pessoa indicada por ele podera gerar direito a participacao do SO CASA TOP, quando houver nexo comercial com a origem.');
    P('O PARCEIRO devera informar a evolucao do lead: visita, proposta, negociacao, fechamento, desistencia ou troca de imovel.');

    H2('10. Proibicao de bypass e protecao da origem comercial');
    P('Vedado contornar, ocultar, transferir, mascarar ou desviar leads originados pelo SO CASA TOP. Constituem bypass: negociar por fora lead registrado, trocar corretor sem informar, simular origem propria, fechar imovel similar com mesmo cliente sem registro, apagar mensagens, bloquear auditoria razoavel, orientar cliente a nao mencionar o SO CASA TOP.');
    P('Confirmado o bypass, o SO CASA TOP podera cobrar a comissao integral, aplicar multa nao compensatoria de ate 2 vezes o valor devido, suspender a regiao, encerrar a parceria, bloquear acessos e adotar medidas judiciais.');

    H2('11. Obrigacoes do So Casa Top');
    P('(i) manter ambiente tecnologico de captacao e organizacao de leads; (ii) empregar esforcos razoaveis de marketing e qualificacao; (iii) registrar origem dos leads; (iv) disponibilizar canais operacionais; (v) informar criterios gerais de distribuicao; (vi) preservar dados conforme LGPD; (vii) tratar parceiros de forma isonomica.');

    H2('12. Obrigacoes do parceiro');
    P('(i) manter CRECI regular; (ii) fornecer informacoes verdadeiras sobre imoveis; (iii) responder leads com rapidez e profissionalismo; (iv) atualizar status de negociacoes; (v) respeitar a origem do lead; (vi) pagar mensalidade e comissao devidas; (vii) obter autorizacoes dos proprietarios para divulgacao; (viii) respeitar LGPD; (ix) nao praticar propaganda enganosa; (x) zelar pela imagem do SO CASA TOP.');

    H2('13. SLA de atendimento e performance');
    P('Padroes minimos: resposta rapida, postura consultiva, registro de interacoes, tentativa de agendamento, follow-up e reporte de status. O SO CASA TOP podera medir indicadores como tempo medio de resposta, leads qualificados, visitas agendadas, propostas, fechamento, atualizacao de funil e taxa de conversao. Baixa performance persistente podera gerar plano de melhoria, reducao de distribuicao, aumento da participacao na regua de 15% a 25%, suspensao ou encerramento.');

    H2('14. Pagamentos, vencimento e inadimplencia');
    P('Mensalidade de ' + valorStr + ' vencera na data definida no checkout, contrato eletronico, boleto, cartao, Pix, link de pagamento ou outro meio indicado. Atraso podera acarretar suspensao de acesso, pausa na distribuicao de leads, retirada temporaria de imoveis e cobranca de encargos legais.');
    P('Comissoes sobre vendas deverao ser pagas em concomitancia com o recebimento da comissao imobiliaria definida em Contrato ou Promessa de Compra e Venda, onde o So Casa Top ja e admitido como participe, recebendo diretamente do Vendedor ou do Comprador conforme pactuado, mediante apresentacao de nota fiscal.');

    H2('15. Imovel captado pelo So Casa Top');
    P('Para todos os imoveis cuja captacao tenha sido realizada direta ou indiretamente pela plataforma So Casa Top, ficara assegurado a So Casa Top o direito ao recebimento de 15% (quinze por cento) sobre o valor total da comissao de corretagem, independentemente da origem do comprador ou do canal pelo qual a venda venha a ser concretizada.');
    P('O percentual sera devido mesmo quando a venda ocorra por: leads proprios do PARCEIRO; indicacoes de terceiros; outros corretores ou imobiliarias; canais externos a plataforma So Casa Top.');
    P('Adicionalmente, nos casos em que o negocio tenha origem em lead gerado, qualificado ou intermediado pelo So Casa Top, sera devido percentual variavel adicional sobre a comissao, que somado aos 15% acima, podera totalizar entre 30% e 40%, conforme criterios de desempenho.');
    P('Para fins de clareza: (a) Imovel captado pela So Casa Top + venda por qualquer origem -> 15% da comissao; (b) Imovel captado pela So Casa Top + venda por lead da So Casa Top -> 15% + percentual adicional (15% a 25%).');

    H2('16. Propriedade intelectual, marca e conteudo');
    P('A marca SO CASA TOP, sistemas, fluxos, textos, automacoes, layouts, bases de dados, metodologias, relatorios e tecnologia pertencem exclusivamente ao SO CASA TOP. O PARCEIRO concede ao SO CASA TOP autorizacao nao exclusiva para usar fotos, videos, descricoes e materiais dos imoveis cadastrados, enquanto o imovel estiver ativo ou houver lead em andamento. O PARCEIRO declara possuir autorizacao do proprietario para uso das imagens e informacoes.');

    H2('17. Dados pessoais, LGPD e confidencialidade');
    P('As partes comprometem-se a cumprir a LGPD (Lei 13.709/2018). O PARCEIRO devera proteger dados de leads, nao compartilhar contatos indevidamente, nao exportar bases sem autorizacao e nao usar leads do SO CASA TOP para finalidade diversa. Informacoes comerciais, tecnicas, listas de leads, criterios de distribuicao, contratos e metodologias sao confidenciais.');

    H2('18. Independencia das partes');
    P('Este contrato nao cria vinculo empregaticio, sociedade, franquia, mandato, agencia, representacao legal ou exclusividade absoluta. O PARCEIRO atua de forma independente, assumindo seus tributos, encargos, obrigacoes perante CRECI, equipe e responsabilidades perante clientes.');

    H2('19. Responsabilidades e limitacoes');
    P('O SO CASA TOP nao responde por vicios do imovel, inadimplemento, documentacao irregular, omissoes do proprietario, preco incorreto, desistencia de partes ou conduta profissional do PARCEIRO. A plataforma podera sofrer indisponibilidades temporarias por terceiros, provedores, APIs ou forca maior. Responsabilidade total limitada aos valores pagos pelo PARCEIRO nos 3 meses anteriores ao evento, salvo dolo ou culpa grave.');

    H2('20. Rescisao, cancelamento e efeitos posteriores');
    P('Cancelamento pelo PARCEIRO a qualquer momento, sem multa, por canal oficial. O encerramento nao elimina obrigacoes ja constituidas: pagamento de mensalidades vencidas, comissoes de negocios originados, dever de confidencialidade, protecao de dados e proibicao de bypass.');

    H2('21. Assinatura eletronica, comunicacoes e validade probatoria');
    P('As partes reconhecem a validade de assinatura eletronica, aceite digital, confirmacao por e-mail, WhatsApp, checkout, IP, logs e codigos de verificacao (MP 2.200-2/2001). Comunicacoes oficiais por e-mail, WhatsApp, paineis ou enderecos informados.');

    H2('22. Disposicoes gerais');
    P('A tolerancia de uma parte quanto ao descumprimento da outra nao implicara renuncia ou novacao. Caso qualquer clausula seja considerada invalida, as demais permanecerao validas. Anexos, politicas comerciais, termos de uso, regras de distribuicao, tabela de performance e materiais de onboarding poderao complementar este contrato.');

    H2('23. Foro');
    P('Fica eleito o foro da Comarca de Brasilia/DF, com renuncia a qualquer outro, para dirimir controversias decorrentes deste contrato.');

    doc.addPage();
    H2('ANEXO I - Regua sugerida de comissao por performance');
    P('Alta performance: resposta rapida, funil atualizado, conversao acima de 3,5% dos leads recebidos, baixa friccao -> Participacao SCT: 15% (parceiro maduro e eficiente).');
    P('Intermediaria: boa aderencia, conversao entre 3,0% e 3,4% ou atualizacao ainda irregular -> Participacao SCT: 20% (faixa padrao).');
    P('Em desenvolvimento: conversao abaixo de 2,9%, SLA fraco, alta necessidade de suporte -> Participacao SCT: 25% (pode exigir plano de melhoria).');
    doc.moveDown(0.6);

    H2('ANEXO II - Politica operacional de leads e funil');
    Bullet('Lead recebido deve ser respondido preferencialmente em ate 15 minutos em horario comercial.');
    Bullet('Status minimo: novo, qualificado, visita, proposta, negociacao, fechado, perdido ou em nutricao.');
    Bullet('Toda visita, proposta ou fechamento deve ser comunicado ao So Casa Top.');
    Bullet('Lead com carimbo de origem permanece protegido por ate 12 meses, salvo ajuste diverso.');
    doc.moveDown(0.6);

    H2('ANEXO III - Declaracoes do parceiro');
    Bullet('Declaro possuir regularidade profissional/empresarial para atuar no mercado imobiliario.');
    Bullet('Declaro que os imoveis informados possuem autorizacao de divulgacao ou intermediacao.');
    Bullet('Declaro compreender que nao ha fidelidade e que posso cancelar a qualquer momento.');
    Bullet('Declaro ciencia de que a participacao do So Casa Top sobre vendas varia entre 15% e 25%, conforme performance.');
    doc.moveDown(0.6);

    H2('ANEXO IV - Referencias normativas');
    Bullet('Codigo Civil brasileiro - Lei no 10.406/2002.');
    Bullet('Lei Geral de Protecao de Dados Pessoais - Lei no 13.709/2018.');
    Bullet('Marco Civil da Internet - Lei no 12.965/2014.');
    Bullet('CLT - Decreto-Lei no 5.452/1943 (referencia para evitar elementos de vinculo trabalhista).');

    doc.moveDown(2);
    doc.font('Helvetica').fontSize(10).text('Brasilia/DF, ' + hoje + '.', { align: 'left' });
    doc.moveDown(2);

    doc.font('Helvetica').fontSize(10);
    doc.text('________________________________________');
    doc.text('SO CASA TOP');
    doc.text('CNPJ: ' + EMPRESA.cnpj);
    doc.text('Representante: ' + EMPRESA.representante);
    doc.moveDown(1);

    doc.text('________________________________________');
    doc.text('PARCEIRO: ' + (nome || ''));
    doc.text(docLabel + ': ' + (cpf || ''));
    if (creci) doc.text('CRECI: ' + creci);
    if (isPJ && representante_nome) {
      doc.text('Representante: ' + representante_nome + (representante_cpf ? ' - CPF ' + representante_cpf : ''));
    }
    doc.moveDown(1);

    doc.text('________________________________________');
    doc.text('TESTEMUNHA 1   Nome:   CPF:');
    doc.moveDown(0.5);
    doc.text('________________________________________');
    doc.text('TESTEMUNHA 2   Nome:   CPF:');
    doc.moveDown(1);

    doc.fontSize(9).fillColor('#666').text('Assinaturas eletronicas pelas partes via ClickSign (validade juridica - MP 2.200-2/2001).', { align: 'center' });

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
