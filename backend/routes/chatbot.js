const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chat, getSuggestions } = require('../controllers/chatbotController');

router.use(protect);
router.post('/message', chat);
router.get('/suggestions', getSuggestions);

module.exports = router;
