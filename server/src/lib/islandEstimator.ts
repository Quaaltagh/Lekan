// ── lib/islandEstimator.ts ────────────────────────────────────────────────────
// Deteksi pulau dari teks alamat, lalu hitung estimasi tiba berdasarkan rute.

type Island = 'jawa' | 'sumatra' | 'kalimantan' | 'sulawesi' | 'papua' | 'bali' | 'ntt' | 'ntb' | 'maluku' | 'unknown';

const ISLAND_KEYWORDS: Record<Island, string[]> = {
  jawa: [
    'jakarta', 'surabaya', 'bandung', 'semarang', 'yogyakarta', 'jogja',
    'malang', 'bekasi', 'depok', 'tangerang', 'bogor', 'solo', 'surakarta',
    'jawa', 'java', 'cirebon', 'kudus', 'pekalongan', 'tegal', 'cilacap',
    'purwokerto', 'madiun', 'kediri', 'blitar', 'jember', 'banyuwangi',
    'gresik', 'sidoarjo', 'mojokerto', 'pasuruan', 'probolinggo',
  ],
  sumatra: [
    'medan', 'palembang', 'pekanbaru', 'batam', 'padang', 'bandar lampung',
    'lampung', 'jambi', 'bengkulu', 'aceh', 'banda aceh', 'binjai',
    'sumatra', 'sumatera', 'riau', 'sijunjung', 'bukittinggi', 'payakumbuh',
    'tanjung pinang', 'tanjungpinang', 'dumai', 'bagan siapi-api',
  ],
  kalimantan: [
    'pontianak', 'samarinda', 'balikpapan', 'banjarmasin', 'palangkaraya',
    'palangka raya', 'tarakan', 'kalimantan', 'borneo', 'singkawang',
    'bontang', 'nunukan', 'kotabaru', 'sampit', 'pangkalan bun',
    'ketapang', 'sintang', 'sanggau',
  ],
  sulawesi: [
    'makassar', 'manado', 'palu', 'kendari', 'gorontalo', 'mamuju',
    'sulawesi', 'celebes', 'parepare', 'palopo', 'bitung', 'kotamobagu',
    'luwuk', 'poso', 'kolaka', 'raha', 'baubau',
  ],
  papua: [
    'jayapura', 'sorong', 'manokwari', 'timika', 'merauke', 'nabire',
    'biak', 'wamena', 'fakfak', 'kaimana', 'papua', 'irian',
  ],
  bali: [
    'denpasar', 'bali', 'kuta', 'ubud', 'singaraja', 'gianyar',
    'tabanan', 'badung', 'buleleng', 'karangasem',
  ],
  ntt: [
    'kupang', 'ntt', 'nusa tenggara timur', 'flores', 'ende', 'maumere',
    'ruteng', 'labuan bajo', 'waingapu', 'waikabubak', 'atambua', 'soe',
  ],
  ntb: [
    'mataram', 'ntb', 'nusa tenggara barat', 'lombok', 'sumbawa',
    'bima', 'dompu', 'praya',
  ],
  maluku: [
    'ambon', 'ternate', 'tidore', 'maluku', 'maluku utara', 'sofifi',
    'tual', 'saumlaki', 'namlea', 'masohi',
  ],
  unknown: [],
};

export function detectIsland(address: string): Island {
  if (!address) return 'unknown';
  const lower = address.toLowerCase();
  for (const [island, keywords] of Object.entries(ISLAND_KEYWORDS) as [Island, string[]][]) {
    if (island === 'unknown') continue;
    if (keywords.some(kw => lower.includes(kw))) return island;
  }
  return 'unknown';
}

// Matriks estimasi hari [min, max]
// Jika salah satu unknown → fallback ke antar pulau jauh
type DayRange = [number, number];

function getEstimatedDays(from: Island, to: Island): DayRange {
  if (from === to || (from !== 'unknown' && to !== 'unknown' && from === to)) {
    return [1, 2]; // sama pulau
  }

  const route = [from, to].sort().join('|') as string;

  const matrix: Record<string, DayRange> = {
    // Jawa ↔ lainnya
    'jawa|sumatra':     [2, 3],
    'jawa|kalimantan':  [3, 4],
    'jawa|sulawesi':    [4, 5],
    'jawa|papua':       [6, 8],
    'jawa|bali':        [1, 2],
    'jawa|ntb':         [2, 3],
    'jawa|ntt':         [3, 4],
    'jawa|maluku':      [5, 6],

    // Sumatra ↔ lainnya
    'kalimantan|sumatra': [3, 5],
    'sulawesi|sumatra':   [5, 6],
    'papua|sumatra':      [7, 9],
    'bali|sumatra':       [3, 4],
    'ntb|sumatra':        [4, 5],
    'ntt|sumatra':        [5, 6],
    'maluku|sumatra':     [6, 7],

    // Kalimantan ↔ lainnya
    'kalimantan|sulawesi': [3, 4],
    'kalimantan|papua':    [6, 7],
    'bali|kalimantan':     [3, 4],
    'kalimantan|ntb':      [4, 5],
    'kalimantan|ntt':      [4, 5],
    'kalimantan|maluku':   [5, 6],

    // Sulawesi ↔ lainnya
    'papua|sulawesi':   [5, 6],
    'bali|sulawesi':    [3, 4],
    'ntb|sulawesi':     [4, 5],
    'ntt|sulawesi':     [4, 5],
    'maluku|sulawesi':  [3, 4],

    // Papua ↔ lainnya
    'bali|papua':    [7, 9],
    'ntb|papua':     [7, 9],
    'ntt|papua':     [6, 8],
    'maluku|papua':  [4, 5],

    // Bali ↔ lainnya
    'bali|ntb':   [1, 2],
    'bali|ntt':   [2, 3],
    'bali|maluku':[4, 5],

    // NTB ↔ NTT
    'ntb|ntt': [2, 3],
    'maluku|ntb': [4, 5],
    'maluku|ntt': [4, 5],
  };

  return matrix[route] ?? [7, 10]; // antar pulau jauh / unknown
}

/**
 * Hitung estimasi tiba berdasarkan alamat asal & tujuan.
 * Mengembalikan ISO string tanggal estimasi.
 */
export function calculateEstimatedArrival(pickupAddress: string, deliveryAddress: string): string {
  const fromIsland = detectIsland(pickupAddress);
  const toIsland   = detectIsland(deliveryAddress);
  const [minDays, maxDays] = getEstimatedDays(fromIsland, toIsland);

  // Ambil tengah-tengah range sebagai estimasi utama
  const avgDays = Math.round((minDays + maxDays) / 2);
  const arrival = new Date();
  arrival.setDate(arrival.getDate() + avgDays);
  arrival.setHours(14, 0, 0, 0); // default jam 14:00

  return arrival.toISOString();
}

/**
 * Return label human-readable untuk frontend, misal "2–3 hari"
 */
export function getEstimatedLabel(pickupAddress: string, deliveryAddress: string): string {
  const fromIsland = detectIsland(pickupAddress);
  const toIsland   = detectIsland(deliveryAddress);
  const [min, max] = getEstimatedDays(fromIsland, toIsland);
  return `${min}–${max} hari`;
}