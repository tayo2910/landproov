const axios = require('axios');
const supabase = require('../lib/supabase');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  const res = await axios.post(`${PAYPAL_API}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: { username: PAYPAL_CLIENT_ID, password: PAYPAL_CLIENT_SECRET },
    }
  );
  return res.data.access_token;
}

async function createOrder(req, res) {
  try {
    const { amount, serviceId } = req.body;
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(500).json({ success: false, message: 'PayPal not configured.' });
    }
    const token = await getAccessToken();
    const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: (amount / 100).toFixed(2) },
        custom_id: String(serviceId || ''),
      }],
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const order = response.data;
    if (serviceId) {
      await supabase
        .from('user_services')
        .update({ payment_reference: order.id, payment_status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', serviceId);
    }
    res.json({ success: true, orderID: order.id });
  } catch (error) {
    console.error('PayPal create order error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Could not create PayPal order.' });
  }
}

async function captureOrder(req, res) {
  try {
    const { orderID, serviceId } = req.body;
    if (!orderID) return res.status(400).json({ success: false, message: 'Order ID is required.' });
    const token = await getAccessToken();
    const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {}, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const capture = response.data;
    if (capture.status === 'COMPLETED') {
      if (serviceId) {
        await supabase
          .from('user_services')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString(), payment_reference: orderID, updated_at: new Date().toISOString() })
          .eq('id', serviceId);
      }
      return res.json({ success: true, message: 'Payment captured.', capture });
    }
    res.status(400).json({ success: false, message: 'Payment not completed.', capture });
  } catch (error) {
    console.error('PayPal capture error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Could not capture payment.' });
  }
}

module.exports = { createOrder, captureOrder };
