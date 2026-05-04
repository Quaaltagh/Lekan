import { supabase } from './src/config/supabaseClient';

async function checkDatabase() {
  console.log("Checking logistics table...");
  const { data, error } = await supabase.from('logistics').select('*');
  
  if (error) {
    console.error("Error fetching logistics:", error);
  } else {
    console.log(`Found ${data.length} rows in logistics table.`);
    console.log(JSON.stringify(data, null, 2));
  }

  const sellerId = 'ddd14181-ba16-45b4-b090-876d47aa3da8';
  console.log(`\nChecking joined query for seller_id: ${sellerId}...`);
  const { data: joinedData, error: joinedError } = await supabase
    .from('logistics')
    .select(`
      *,
      auctions (
        name,
        weight_kg,
        image_url
      )
    `)
    .eq('seller_id', sellerId);

  if (joinedError) {
    console.error("Joined query error:", joinedError);
  } else {
    console.log(`Joined query returned ${joinedData?.length || 0} rows.`);
    console.log(JSON.stringify(joinedData, null, 2));
  }
}

checkDatabase();
