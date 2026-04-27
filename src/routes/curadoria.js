const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/curadoria');

router.post('/solicitar', async (req, res) => {
  try {
    const { phone, imovel_id, tipo } = req.body;
    if (!phone || !imovel_id || !tipo) return res.status(400).json({ error: 'phone, imovel_id, tipo obrigatorios' });
    const r = await ctrl.solicitarCuradoria({ phone, imovelId: imovel_id, tipo });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const { phone, status, limit } = req.query;
    if (!phone) return res.status(400).json({ error: 'phone obrigatorio' });
    const data = await ctrl.listarJobs({ phone, status, limit: limit ? parseInt(limit) : 30 });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const data = await ctrl.getJob(parseInt(req.params.id));
    if (!data) return res.status(404).json({ error: 'job nao encontrado' });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/jobs/:id/aprovar', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone obrigatorio' });
    const r = await ctrl.aprovarJob(parseInt(req.params.id), phone);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/jobs/:id/rejeitar', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone obrigatorio' });
    const r = await ctrl.rejeitarJob(parseInt(req.params.id), phone);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
