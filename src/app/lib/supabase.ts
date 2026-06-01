// Simpan di: src/lib/supabase.ts (project Next.js kamu)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl)  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!supabaseAnon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');

export const supabase = createClient(supabaseUrl, supabaseAnon);