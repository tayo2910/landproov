const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const supabase = require('../lib/supabase');
const { getServices, createService } = require('../controllers/servicesController');
const { getUserFromSession } = require('../controllers/authController');
const router = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = 'https://api.paystack.co';

router.get('/user/services', async (req, res) => {
  const user = await getUserFromSession(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  try {
    const services = await getServices(user.id);
    res.json({ success: true, services });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ success: false, message: 'Could not load services.' });
  }
});

router.post(
  '/user/services',
  [
    body('serviceType').trim().notEmpty().withMessage('Service type is required'),
    body('propertyLocation').trim().notEmpty().withMessage('Property location is required'),
    body('amount').isInt({ min: 100 }).withMessage('Amount must be at least $1.00'),
  ],
  async (req, res) => {
    const user = await getUserFromSession(req);
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const amount = parseInt(req.body.amount, 10);
      const service = await createService(user.id, req.body.serviceType, req.body.propertyLocation, req.body.notes, amount);

      if (PAYSTACK_SECRET_KEY && service.amount > 0) {
        const initRes = await axios.post(`${PAYSTACK_API}/transaction/initialize`, {
          email: user.email,
          amount: service.amount,
          currency: 'USD',
          metadata: { service_id: service.id, service_type: service.service_type },
          callback_url: `${process.env.BASE_URL || 'http://localhost:3000'}/dashboard`,
        }, {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
        });
        const txData = initRes.data.data;
        await supabase
          .from('user_services')
          .update({ payment_reference: txData.reference, access_code: txData.access_code, payment_status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', service.id);

        return res.json({
          success: true,
          message: 'Service request submitted. Proceed to payment.',
          service: { ...service, payment_reference: txData.reference, access_code: txData.access_code, payment_status: 'pending' },
          access_code: txData.access_code,
          reference: txData.reference,
        });
      }

      res.json({ success: true, message: 'Service request submitted.', service });
    } catch (err) {
      console.error('Create service error:', err);
      res.status(500).json({ success: false, message: 'Could not submit service request.' });
    }
  }
);

module.exports = router;
