const express = require('express');
const router = express.Router();
const controller = require('../controllers/whatsapp');

// Meta verifica o webhook com GET
router.get('/', controller.verify);

// Meta envia mensagens com POST
router.post('/', controller.receive);

module.exports = router;
