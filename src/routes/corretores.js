const express = require('express');
const router = express.Router();
const controller = require('../controllers/corretores');

router.get('/', controller.listar);
router.get('/:id', controller.detalhe);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);

module.exports = router;
