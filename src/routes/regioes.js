const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/regioes');

router.get('/', ctrl.listar);
router.get('/slug/:slug', ctrl.getBySlug);
router.post('/recontar', ctrl.recontar);
router.put('/:id', ctrl.ajustarVagas);

module.exports = router;
