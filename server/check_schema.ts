import { supabase } from './src/config/supabaseClient';

async function run() {
  console.log("Checking logistics...");
  const { data: logistics, error: lError } = await supabase.from('logistics').select('*').limit(1);
  if (lError) console.error("Logistics error:", lError);
  else console.log("Logistics record keys:", logistics.length > 0 ? Object.keys(logistics[0]) : "No records");

  console.log("Checking auctions...");
  const { data: auctions, error: aError } = await supabase.from('auctions').select('*').limit(1);
  if (aError) console.error("Auctions error:", aError);
  else console.log("Auctions record keys:", auctions.length > 0 ? Object.keys(auctions[0]) : "No records");
}

run();
