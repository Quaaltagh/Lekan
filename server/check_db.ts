import { supabase } from './src/config/supabaseClient';

async function run() {
  const { data: wallets, error: wError } = await supabase.from('wallets').select('*');
  console.log("Wallets:", wallets);
  
  const { data: txs, error: txError } = await supabase.from('transactions').select('*').limit(20);
  console.log("Transactions:", txs);
}

run();
