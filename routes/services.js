const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const supabase = require('../lib/supabase');
const { getServices, createService } = require('../controllers/servicesController');
const { getUserFromSession } = require('../controllers/authController');
const router = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = 'https://api.paystack.co';
const USD_TO_NGN = parseFloat(process.env.USD_TO_NGN_RATE) || 1500;

router.get('/user/services', async (req, res) => {
  const user = await getUserFromSession(req, res);
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
  ],
  async (req, res) => {
    const user = await getUserFromSession(req, res);
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const service = await createService(user.id, req.body.serviceType, req.body.propertyLocation, req.body.notes);
      const paymentMethod = req.body.paymentMethod || 'paystack';

      if (paymentMethod === 'paystack' && PAYSTACK_SECRET_KEY && service.amount > 0) {
        const ngnAmount = Math.round(service.amount * USD_TO_NGN);
        const initRes = await axios.post(`${PAYSTACK_API}/transaction/initialize`, {
          email: user.email,
          amount: ngnAmount,
          currency: 'NGN',
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
          message: 'Service request submitted.',
          service: { ...service, payment_reference: txData.reference, access_code: txData.access_code, payment_status: 'pending' },
          access_code: txData.access_code,
          reference: txData.reference,
          paymentMethod: 'paystack',
        });
      }

      res.json({ success: true, message: 'Service request submitted.', service, paymentMethod });
    } catch (err) {
      console.error('Create service error:', err);
      res.status(500).json({ success: false, message: 'Could not submit service request.' });
    }
  }
);

module.exports = router;
