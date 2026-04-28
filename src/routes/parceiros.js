const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/parceiros');

router.post('/', ctrl.iniciarCadastro);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.get);
router.post('/:id/cartao', ctrl.cadastrarCartao);
router.post('/:id/contrato', ctrl.enviarContrato);
router.post('/:id/pagamento', ctrl.iniciarPagamento);
router.post('/:id/cancelar', ctrl.cancelar);

module.exports = router;
