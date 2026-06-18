const { Router } = require('express');
const { initializeTransaction, verifyTransaction } = require('../controllers/paymentController');
const { getUserFromSession } = require('../controllers/authController');
const router = Router();

router.post('/payment/init', async (req, res) => {
  const user = await getUserFromSession(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  req.body.email = user.email;
  await initializeTransaction(req, res);
});

router.post('/payment/verify', async (req, res) => {
  const user = await getUserFromSession(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  await verifyTransaction(req, res);
});

module.exports = router;
