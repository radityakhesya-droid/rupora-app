'use client';

import React, { useState } from 'react';
import { useRupora } from '@/context/RuporaContext';
import { getSupabaseClient } from '@/lib/supabase';

export function LoginView() {
  const { loginDemo, setActivePage } = useRupora();
  const [email, setEmail] = useState('jisamsoe178@gmail.com');
  const [password, setPassword] = useState('Kopijahe');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg('Konfigurasi Supabase di .env.local belum terbaca. Pastikan file sudah di-save dan server di-restart.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(`Supabase Auth: ${error.message}`);
        return;
      }
      const displayName = data.user?.user_metadata?.full_name || email.split('@')[0];
      loginDemo(data.user?.email || email, displayName);
    } catch (err) {
      setErrorMsg(`Koneksi gagal: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F5F9] px-4 dark:bg-[#0E1621]">
      <div className="w-full max-w-md rounded-[24px] border border-[#E8EDF3] bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[11px] font-bold tracking-wider text-[#356DFF] uppercase">RUPORA</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Masuk ke RUPORA</h1>
        <p className="mt-1 text-xs text-[#8B95A5]">
          Login menggunakan akun yang terdaftar di Supabase.
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="text-xs font-semibold">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E8EDF3] px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E8EDF3] px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#356DFF] py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => loginDemo(email, 'Dizyy')}
          className="mt-2.5 w-full rounded-xl border border-[#E8EDF3] py-2 text-xs font-semibold text-[#8B95A5] hover:bg-[#F3F5F9] dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Masuk Cepat (Mode Lokal)
        </button>

        <p className="mt-4 text-center text-xs text-[#8B95A5]">
          Belum punya akun?{' '}
          <button
            type="button"
            onClick={() => setActivePage('signup')}
            className="font-semibold text-[#356DFF] hover:underline"
          >
            Daftar akun baru
          </button>
        </p>
      </div>
    </div>
  );
}

export function SignUpView() {
  const { signupDemo, setActivePage } = useRupora();
  const [name, setName] = useState('Dizyy');
  const [email, setEmail] = useState('jisamsoe178@gmail.com');
  const [password, setPassword] = useState('Kopijahe');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanName = name.trim() || email.split('@')[0] || 'Trader';
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMsg('Konfigurasi Supabase di .env.local belum terbaca. Restart server terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: cleanName },
        },
      });
      if (error) {
        setErrorMsg(`Supabase Auth: ${error.message}`);
        return;
      }
      if (!data.user) {
        setErrorMsg('Pendaftaran tidak mengembalikan user. Cek pengaturan Authentication -> Email di Supabase.');
        return;
      }
      signupDemo(cleanName, email);
    } catch (err) {
      setErrorMsg(`Koneksi gagal: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F5F9] px-4 dark:bg-[#0E1621]">
      <div className="w-full max-w-md rounded-[24px] border border-[#E8EDF3] bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[11px] font-bold tracking-wider text-[#356DFF] uppercase">RUPORA</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Daftar Akun Baru</h1>
        <p className="mt-1 text-xs text-[#8B95A5]">
          Pendaftar pertama di database otomatis menjadi Admin (Overlord).
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="text-xs font-semibold">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E8EDF3] px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E8EDF3] px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Password (min. 6 karakter)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E8EDF3] px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#356DFF] py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Mendaftarkan...' : 'Daftar Akun'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[#8B95A5]">
          Sudah punya akun?{' '}
          <button
            type="button"
            onClick={() => setActivePage('login')}
            className="font-semibold text-[#356DFF] hover:underline"
          >
            Masuk di sini
          </button>
        </p>
      </div>
    </div>
  );
}
