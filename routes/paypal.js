const { Router } = require('express');
const { createOrder, captureOrder } = require('../controllers/paypalController');
const { getUserFromSession } = require('../controllers/authController');
const router = Router();

router.post('/paypal/create-order', async (req, res) => {
  const user = await getUserFromSession(req, res);
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  await createOrder(req, res);
});

router.post('/paypal/capture-order', async (req, res) => {
  const user = await getUserFromSession(req, res);
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  await captureOrder(req, res);
});

module.exports = router;
