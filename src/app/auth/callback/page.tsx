'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [error, setError] = useState('');
  const hasRun = useRef(false); // ← guard

  useEffect(() => {
    if (hasRun.current) return; // ← stop kalau sudah pernah jalan
    hasRun.current = true;

    const handle = async () => {
      const { data: { session }, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Gagal mendapatkan sesi dari Google. Silakan coba lagi.');
        return;
      }

      const pendingRole = (
        sessionStorage.getItem('lekan_pending_role') ||
        localStorage.getItem('lekan_pending_role')
      ) as 'nelayan' | 'pembeli' | null;

      if (!pendingRole) {
        setError('Role tidak ditemukan. Silakan ulangi proses login.');
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/google-upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ role: pendingRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan profil.');
        return;
      }

      setSession(session.access_token, data.user);
      sessionStorage.removeItem('lekan_pending_role');
      localStorage.removeItem('lekan_pending_role');

      // ── TAMBAHAN SECURITY GUARD: Cek kelengkapan alamat di database ──
      const { data: profile } = await supabase
        .from('profiles')
        .select('address')
        .eq('id', session.user.id)
        .single();

      // Jika dia akun baru (201) ATAU alamatnya belum diisi/kosong, paksa lengkapi profil
      if (res.status === 201 || !profile?.address || profile.address.trim() === '') {
        router.replace('/auth/completeProfile');
      } else {
        router.replace(data.user.role === 'pembeli' ? '/' : '/fisherman/dashboard');
      }
    };

    handle();
  }, [router, setSession]);

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 24,
      }}>
        <p style={{ color: '#ef4444', textAlign: 'center', maxWidth: 360 }}>{error}</p>
        <a href="/auth" style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: 14 }}>
          ← Kembali ke halaman login
        </a>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: 12,
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="3"
          fill="none" strokeDasharray="31" strokeDashoffset="10" />
      </svg>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Memproses login Google…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}