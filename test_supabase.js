const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function test() {
  console.log("URL:", url);
  console.log("KEY prefix:", key.substring(0, 15) + "...");
  
  console.log("Testing SELECT...");
  const { data: selectData, error: selectError } = await supabase.from('users').select('*').limit(1);
  console.log("Select Error/Success:", JSON.stringify(selectError) || "Success");
  
  console.log("Testing INSERT...");
  const { data: insertData, error: insertError } = await supabase.from('users').insert([
    { username: 'test', email: 'test_script_rand@test.com', password: 'test', role: 'citizen', points: 0 }
  ]).select();
  console.log("Insert Error/Success:", JSON.stringify(insertError) || "Success");
}

test();
