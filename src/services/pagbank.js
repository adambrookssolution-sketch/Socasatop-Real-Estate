const axios = require('axios');

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN || '';
const PAGBANK_BASE = process.env.PAGBANK_API_BASE || 'https://api.pagseguro.com';
const PAGBANK_SANDBOX = process.env.PAGBANK_SANDBOX === 'true';

const API_URL = PAGBANK_SANDBOX ? 'https://sandbox.api.pagseguro.com' : PAGBANK_BASE;

function isConfigured() {
  return !!PAGBANK_TOKEN;
}

function authHeaders() {
  return {
    'Authorization': 'Bearer ' + PAGBANK_TOKEN,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'SoCasaTop/1.0 (+https://socasatop.com.br)',
  };
}

async function criarCustomer({ nome, email, cpf_cnpj, whatsapp }) {
  if (!isConfigured()) throw new Error('PagBank nao configurado. Defina PAGBANK_TOKEN no .env');
  const taxId = (cpf_cnpj || '').replace(/\D/g, '');
  const tipoTax = taxId.length === 11 ? 'CPF' : 'CNPJ';
  const phone = (whatsapp || '').replace(/\D/g, '');
  const phoneArea = phone.substring(2, 4);
  const phoneNumber = phone.substring(4);

  const body = {
    name: nome,
    email: email,
    tax_id: taxId,
    phones: phone ? [{
      country: '55',
      area: phoneArea,
      number: phoneNumber,
      type: 'MOBILE',
    }] : undefined,
  };

  const response = await axios.post(API_URL + '/customers', body, {
    headers: authHeaders(),
    timeout: 30000,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new Error('PagBank customer error: ' + JSON.stringify(response.data).substring(0, 300));
  }
  return response.data;
}

async function criarPlano({ nome, valorCentavos, intervalo, descricao }) {
  if (!isConfigured()) throw new Error('PagBank nao configurado');

  const body = {
    reference_id: 'plano-' + Date.now(),
    name: nome,
    description: descricao || nome,
    amount: { value: valorCentavos, currency: 'BRL' },
    interval: { unit: intervalo || 'MONTH', length: 1 },
    trial: { enabled: true, hold_setup_fee: false, days: 21 },
  };

  const response = await axios.post(API_URL + '/plans', body, {
    headers: authHeaders(),
    timeout: 30000,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new Error('PagBank plano error: ' + JSON.stringify(response.data).substring(0, 300));
  }
  return response.data;
}

async function criarSubscription({ planId, customerId, paymentMethod }) {
  if (!isConfigured()) throw new Error('PagBank nao configurado');

  const body = {
    reference_id: 'sub-' + Date.now(),
    plan: { id: planId },
    customer: { id: customerId },
    payment_method: paymentMethod,
  };

  const response = await axios.post(API_URL + '/subscriptions', body, {
    headers: authHeaders(),
    timeout: 30000,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new Error('PagBank subscription error: ' + JSON.stringify(response.data).substring(0, 300));
  }
  return response.data;
}

async function criarCheckoutPix({ valorCentavos, descricao, referenceId, customerData }) {
  if (!isConfigured()) throw new Error('PagBank nao configurado');

  const body = {
    reference_id: referenceId || 'pix-' + Date.now(),
    items: [{
      name: descricao || 'Compra de creditos',
      quantity: 1,
      unit_amount: valorCentavos,
    }],
    qr_codes: [{ amount: { value: valorCentavos } }],
    customer: customerData ? {
      name: customerData.nome,
      email: customerData.email,
      tax_id: (customerData.cpf_cnpj || '').replace(/\D/g, ''),
    } : undefined,
    notification_urls: process.env.PAGBANK_WEBHOOK_URL ? [process.env.PAGBANK_WEBHOOK_URL] : undefined,
  };

  const response = await axios.post(API_URL + '/orders', body, {
    headers: authHeaders(),
    timeout: 30000,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new Error('PagBank pix error: ' + JSON.stringify(response.data).substring(0, 300));
  }
  return response.data;
}

async function getSubscription(subscriptionId) {
  if (!isConfigured()) throw new Error('PagBank nao configurado');
  const response = await axios.get(API_URL + '/subscriptions/' + subscriptionId, {
    headers: authHeaders(),
    timeout: 30000,
    validateStatus: () => true,
  });
  if (response.status >= 400) throw new Error('PagBank get sub error: ' + response.status);
  return response.data;
}

async function cancelSubscription(subscriptionId) {
  if (!isConfigured()) throw new Error('PagBank nao configurado');
  const response = await axios.put(API_URL + '/subscriptions/' + subscriptionId + '/cancel', {}, {
    headers: authHeaders(),
    timeout: 30000,
    validateStatus: () => true,
  });
  if (response.status >= 400) throw new Error('PagBank cancel error: ' + response.status);
  return response.data;
}

module.exports = {
  isConfigured,
  criarCustomer,
  criarPlano,
  criarSubscription,
  criarCheckoutPix,
  getSubscription,
  cancelSubscription,
};
