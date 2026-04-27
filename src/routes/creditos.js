const express = require('express');
const router = express.Router();
const creditos = require('../services/creditos');
const permissions = require('../services/permissions');

async function findParceiro(phone) {
  if (permissions.isADM(phone)) return { tipo: 'adm', id: 0 };
  const gestor = await permissions.getGestor(phone);
  if (gestor) return { tipo: 'gestor', id: gestor.id };
  const corretor = await permissions.getCorretor(phone);
  if (corretor) return { tipo: 'corretor', id: corretor.id };
  return null;
}

router.get('/pacotes', async (req, res) => {
  try {
    const data = await creditos.listarPacotes();
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/saldo', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'phone obrigatorio' });
    const p = await findParceiro(phone);
    if (!p) return res.status(403).json({ error: 'parceiro nao encontrado' });
    const s = await creditos.getSaldo(p.tipo, p.id);
    res.json({ data: s, parceiro: p });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/transacoes', async (req, res) => {
  try {
    const { phone, limit } = req.query;
    if (!phone) return res.status(400).json({ error: 'phone obrigatorio' });
    const p = await findParceiro(phone);
    if (!p) return res.status(403).json({ error: 'parceiro nao encontrado' });
    const data = await creditos.listarTransacoes({ parceiroTipo: p.tipo, parceiroId: p.id, limit: limit ? parseInt(limit) : 30 });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/adicionar-manual', async (req, res) => {
  try {
    const { phone_adm, parceiro_tipo, parceiro_id, quantidade, validade_dias } = req.body;
    if (!permissions.isADM(phone_adm)) return res.status(403).json({ error: 'apenas ADM' });
    const r = await creditos.adicionarCreditos({
      parceiroTipo: parceiro_tipo,
      parceiroId: parceiro_id,
      quantidade: parseInt(quantidade),
      validadeDias: validade_dias ? parseInt(validade_dias) : 30,
    });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
