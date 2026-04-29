const supabase = require('../config/supabase');
const parceirosCtrl = require('./parceiros');
const creditos = require('../services/creditos');
const notifyAdm = require('../services/notify_adm');

async function pagbankWebhook(req, res) {
  try {
    const event = req.body || {};
    const tipo = event.event_type || event.type || event.notificationType || 'desconhecido';
    const subscriptionId = event.subscription_id || (event.data && event.data.subscription_id) || (event.subscription && event.subscription.id);
    const orderId = event.order_id || event.id || (event.data && event.data.id);
    const status = event.status || (event.data && event.data.status);
    const referenceId = event.reference_id || (event.data && event.data.reference_id);

    console.log('[PagBank webhook]', tipo, '| sub:', subscriptionId, '| order:', orderId, '| status:', status);

    if (subscriptionId) {
      const { data: parceiro } = await supabase
        .from('parceiros')
        .select('*')
        .eq('pagbank_subscription_id', subscriptionId)
        .maybeSingle();
      if (parceiro) {
        await parceirosCtrl.logEvento(parceiro.id, 'pagbank_webhook', { tipo, status, raw: event });
        const updates = {};
        if (status === 'ACTIVE' || tipo === 'subscription.activated') {
          updates.status = 'ocupado';
          updates.subscription_started_at = new Date().toISOString();
        } else if (status === 'PAID' || tipo === 'subscription.charged') {
          updates.subscription_last_payment_at = new Date().toISOString();
        } else if (status === 'PAST_DUE' || tipo === 'subscription.failed') {
          updates.subscription_failed_at = new Date().toISOString();
          updates.status = 'suspenso';
          notifyAdm.pagamentoFalhou(parceiro, status || tipo).catch(() => {});
        } else if (status === 'CANCELED' || tipo === 'subscription.canceled') {
          updates.status = 'cancelado';
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from('parceiros').update(updates).eq('id', parceiro.id);
          if (updates.status) await parceirosCtrl.atualizarContadorRegiao(parceiro.regiao_id);
        }
      }
    }

    if (referenceId && referenceId.startsWith('creditos-')) {
      const parts = referenceId.split('-');
      const parceiroTipo = parts[1];
      const parceiroId = parseInt(parts[2]);
      const pacoteId = parseInt(parts[3]);

      if (status === 'PAID' && parceiroTipo && parceiroId && pacoteId) {
        const pacote = await creditos.getPacote(pacoteId);
        if (pacote) {
          await creditos.adicionarCreditos({
            parceiroTipo,
            parceiroId,
            quantidade: pacote.imagens,
            pacoteId: pacote.id,
            pagamentoId: orderId || referenceId,
            validadeDias: pacote.validade_dias,
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (e) {
    console.log('[PagBank webhook ERROR]', e.message);
    res.status(200).json({ received: true, error: e.message });
  }
}

async function clicksignWebhook(req, res) {
  try {
    const event = req.body || {};
    const documentKey = event.document && event.document.key;
    const eventName = event.event && event.event.name;

    console.log('[ClickSign webhook]', eventName, '| doc:', documentKey);

    if (documentKey) {
      const { data: parceiro } = await supabase
        .from('parceiros')
        .select('*')
        .eq('clicksign_document_key', documentKey)
        .maybeSingle();
      if (parceiro) {
        await parceirosCtrl.logEvento(parceiro.id, 'clicksign_webhook', { eventName, raw: event });

        if (eventName === 'auto_close' || eventName === 'sign' || eventName === 'document_closed') {
          await supabase.from('parceiros').update({
            contract_signed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', parceiro.id);
          notifyAdm.contratoAssinado(parceiro).catch(() => {});
        }
      }
    }
    res.status(200).json({ received: true });
  } catch (e) {
    console.log('[ClickSign webhook ERROR]', e.message);
    res.status(200).json({ received: true, error: e.message });
  }
}

module.exports = { pagbankWebhook, clicksignWebhook };
