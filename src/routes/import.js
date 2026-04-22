const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/import');

router.post('/url', ctrl.handleImportEndpoint);

module.exports = router;
