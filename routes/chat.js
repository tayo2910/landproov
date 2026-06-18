const { Router } = require('express');
const { getAIResponse } = require('../controllers/chatController');
const router = Router();

router.post('/chat', async (req, res) => {
  const message = req.body.message && req.body.message.trim();
  if (!message) {
    return res.status(422).json({ success: false, message: 'Message is required.' });
  }

  try {
    const reply = await getAIResponse(message);
    res.json({ success: true, reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

module.exports = router;
