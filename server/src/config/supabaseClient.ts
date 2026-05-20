import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Pastikan env vars ter-load sebelum diakses,
// terlepas dari urutan import di index.ts
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl) throw new Error("SUPABASE_URL is required");
if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY is required");

// ── Client utama — SERVICE_ROLE_KEY, bypass RLS, untuk semua query DB ────────
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// ── Auth client — ANON_KEY, khusus untuk signInWithPassword ──────────────────
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});