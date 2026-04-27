const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/webhooks_pagamentos');

router.post('/pagbank', ctrl.pagbankWebhook);
router.post('/clicksign', ctrl.clicksignWebhook);

module.exports = router;
