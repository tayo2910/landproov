const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing — set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
}

const supabase = createClient(
  supabaseUrl || 'http://localhost',
  supabaseAnonKey || 'missing-key'
);

module.exports = supabase;
