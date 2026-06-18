import { createClient } from '@supabase/supabase-js';

// Hardcoded for the presentation to avoid any .env restart issues
const supabaseUrl = 'https://tiqaavcfwprihlfntefb.supabase.co';
const supabaseAnonKey = 'sb_publishable_BLE5c9fVee1D7-3FyUcMsA_mltVkHo-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
