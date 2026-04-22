const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/galeria');

router.get('/:token', ctrl.renderPage);

const api = express.Router();
api.get('/:token/imoveis', ctrl.listImoveis);
api.post('/:token/batch', ctrl.batchAction);
api.post('/:token/curadoria', ctrl.askCuradoria);

module.exports = { pageRouter: router, apiRouter: api };
