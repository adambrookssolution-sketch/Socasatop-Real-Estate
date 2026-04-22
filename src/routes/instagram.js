const express = require('express');
const router = express.Router();
const controller = require('../controllers/instagram');

router.get('/', controller.verify);
router.post('/', controller.receive);

module.exports = router;
