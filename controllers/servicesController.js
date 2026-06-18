const supabase = require('../lib/supabase');

const SERVICE_PRICES = {
  'Land & Property Verification': 15000,
  'Land Registration, Survey & Documentation': 180000,
  'Site Visits & Documentation': 30000,
  'Quantity Surveying': 30000,
  'Agent & Developer Meetings': 15000,
  'Project Monitoring': 50000,
};

function getAmountForService(serviceType) {
  return SERVICE_PRICES[serviceType] || 0;
}

async function getServices(userId) {
  const { data, error } = await supabase
    .from('user_services')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function createService(userId, serviceType, propertyLocation, notes) {
  const amount = getAmountForService(serviceType);
  const { data, error } = await supabase
    .from('user_services')
    .insert([{
      user_id: userId,
      service_type: serviceType,
      property_location: propertyLocation,
      notes: notes || '',
      amount,
      payment_status: 'unpaid',
    }])
    .select();
  if (error) throw error;
  return data[0];
}

async function updateServiceStatus(serviceId, userId, status) {
  const { data, error } = await supabase
    .from('user_services')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', serviceId)
    .eq('user_id', userId)
    .select();
  if (error) throw error;
  return data[0];
}

module.exports = { getServices, createService, updateServiceStatus };
