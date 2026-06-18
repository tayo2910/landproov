const axios = require('axios');
const supabase = require('../lib/supabase');

const FW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FW_API = 'https://api.flutterwave.com/v3';

async function initializePayment(req, res) {
  try {
    const { email, amount, serviceId, serviceType } = req.body;
    if (!FW_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Flutterwave not configured.' });
    }
    const tx_ref = 'lp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const response = await axios.post(`${FW_API}/payments`, {
      tx_ref,
      amount: amount / 100,
      currency: 'USD',
      redirect_url: `${process.env.BASE_URL || 'http://localhost:3000'}/dashboard`,
      customer: { email },
      meta: { service_id: String(serviceId || ''), service_type: serviceType || '' },
    }, {
      headers: {
        Authorization: `Bearer ${FW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const data = response.data;
    if (data.status === 'success') {
      if (serviceId) {
        await supabase
          .from('user_services')
          .update({ payment_reference: tx_ref, payment_status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', serviceId);
      }
      return res.json({ success: true, tx_ref, link: data.data.link });
    }
    res.status(400).json({ success: false, message: data.message || 'Could not initialize payment.' });
  } catch (error) {
    console.error('Flutterwave init error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment initialization failed.' });
  }
}

async function verifyPayment(req, res) {
  try {
    const { transaction_id, serviceId } = req.body;
    if (!transaction_id) return res.status(400).json({ success: false, message: 'Transaction ID is required.' });
    const response = await axios.get(`${FW_API}/transactions/${transaction_id}/verify`, {
      headers: { Authorization: `Bearer ${FW_SECRET_KEY}` },
    });
    const body = response.data;
    if (body.status === 'success' && body.data.status === 'successful') {
      if (serviceId) {
        await supabase
          .from('user_services')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString(), payment_reference: String(transaction_id), updated_at: new Date().toISOString() })
          .eq('id', serviceId);
      }
      return res.json({ success: true, message: 'Payment verified.' });
    }
    res.status(400).json({ success: false, message: 'Payment verification failed.' });
  } catch (error) {
    console.error('Flutterwave verify error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
}

module.exports = { initializePayment, verifyPayment };
