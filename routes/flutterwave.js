const { Router } = require('express');
const { initializePayment, verifyPayment } = require('../controllers/flutterwaveController');
const { getUserFromSession } = require('../controllers/authController');
const router = Router();

router.post('/flutterwave/init', async (req, res) => {
  const user = await getUserFromSession(req, res);
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  req.body.email = user.email;
  await initializePayment(req, res);
});

router.post('/flutterwave/verify', async (req, res) => {
  const user = await getUserFromSession(req, res);
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  await verifyPayment(req, res);
});

module.exports = router;
