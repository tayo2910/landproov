const supabase = require('../lib/supabase');

async function getServices(userId) {
  const { data, error } = await supabase
    .from('user_services')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function createService(userId, serviceType, propertyLocation, notes, amount) {
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
