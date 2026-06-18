const axios = require('axios');
const supabase = require('../lib/supabase');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = 'https://api.paystack.co';

async function initializeTransaction(req, res) {
  try {
    const { email, amount, metadata } = req.body;
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Payment not configured.' });
    }
    const response = await axios.post(`${PAYSTACK_API}/transaction/initialize`, {
      email,
      amount,
      currency: 'USD',
      metadata: metadata || {},
      callback_url: `${process.env.BASE_URL || 'http://localhost:3000'}/dashboard`,
    }, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    res.json({ success: true, data: response.data.data });
  } catch (error) {
    console.error('Paystack init error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment initialization failed.' });
  }
}

async function verifyTransaction(req, res) {
  try {
    const { reference, serviceId } = req.body;
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required.' });
    }
    const response = await axios.get(`${PAYSTACK_API}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const body = response.data;
    if (body.status && body.data.status === 'success') {
      if (serviceId) {
        await supabase
          .from('user_services')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString(), payment_reference: reference, updated_at: new Date().toISOString() })
          .eq('id', serviceId);
      }
      return res.json({ success: true, message: 'Payment verified.', data: body.data });
    }
    res.status(400).json({ success: false, message: 'Payment verification failed.' });
  } catch (error) {
    console.error('Paystack verify error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
}

module.exports = { initializeTransaction, verifyTransaction };
