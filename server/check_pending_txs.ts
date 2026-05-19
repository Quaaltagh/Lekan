import { supabase } from './src/config/supabaseClient';

async function run() {
  const userId = 'ddd14181-ba16-45b4-b090-876d47aa3da8';
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }
  
  console.log("All transactions for user:", userId);
  txs.forEach(t => {
    console.log(`ID: ${t.id}, Type: ${t.type}, Amount: ${t.amount}, Status: ${t.status}, Description: ${t.description}, Date: ${t.created_at}`);
  });
}

run();
