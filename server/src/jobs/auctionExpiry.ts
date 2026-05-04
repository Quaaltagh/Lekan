import { supabase } from '../config/supabaseClient';

export async function checkExpiredAuctions() {
  const now = new Date().toISOString();
  console.log('[AuctionExpiry] Cek pada:', now);

  const { data, error } = await supabase
    .from('auctions')
    .update({
      status: 'done',
      updated_at: now,
    })
    .eq('status', 'active')
    .lt('ends_at', now)
    .select('id, name, ends_at');

  if (error) {
    console.error('[AuctionExpiry] Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`[AuctionExpiry] ${data.length} lelang ditutup:`, data.map(a => a.name));
  } else {
    console.log('[AuctionExpiry] Tidak ada lelang yang perlu ditutup.');
  }
}

export function startAuctionExpiryJob(intervalMs = 60_000) {
  console.log('[AuctionExpiry] Job started — cek tiap 1 menit');
  checkExpiredAuctions();
  return setInterval(checkExpiredAuctions, intervalMs);
}