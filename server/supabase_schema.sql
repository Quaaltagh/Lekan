-- Jalankan query ini di Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run

-- Tabel profiles (extends auth.users dari Supabase)
CREATE TABLE public.profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role      TEXT NOT NULL CHECK (role IN ('nelayan', 'pembeli')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa baca profil sendiri
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: user hanya bisa update profil sendiri
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);