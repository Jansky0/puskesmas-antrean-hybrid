"use client";

import Link from "next/link";

export default function Home() {
  const handleOpenTV = (e: React.MouseEvent) => {
    // Jika dibuka di Desktop App (Electron)
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      e.preventDefault();
      (window as any).electronAPI.openTvWindow();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 to-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl mb-12">
        <h1 className="text-4xl font-extrabold tracking-wide mb-2">PUSKESMAS PRAMBONTERGAYANG</h1>
        <p className="text-teal-300 font-medium">Sistem Manajemen Antrean Pelayanan Terpadu Hybrid</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full">
        <Link
          href="/loket"
          className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-2xl flex flex-col items-center justify-center transition shadow-lg text-center"
        >
          <span className="text-3xl mb-2">🎟️</span>
          <span className="font-bold text-lg">Loket Pendaftaran</span>
          <span className="text-xs text-teal-200 mt-1">Cetak Antrean Depan</span>
        </Link>

        <Link
          href="/poli"
          className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-2xl flex flex-col items-center justify-center transition shadow-lg text-center"
        >
          <span className="text-3xl mb-2">🏥</span>
          <span className="font-bold text-lg">Cetak Tiket Poli</span>
          <span className="text-xs text-teal-200 mt-1">Anjungan Pasien</span>
        </Link>

        <Link
          href="/tv"
          onClick={handleOpenTV}
          className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-2xl flex flex-col items-center justify-center transition shadow-lg text-center"
        >
          <span className="text-3xl mb-2">📺</span>
          <span className="font-bold text-lg">Display TV Utama</span>
          <span className="text-xs text-teal-200 mt-1">Layar Ruang Tunggu (Extend Auto)</span>
        </Link>

        <Link
          href="/petugas"
          className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-2xl flex flex-col items-center justify-center transition shadow-lg text-center"
        >
          <span className="text-3xl mb-2">👨‍⚕️</span>
          <span className="font-bold text-lg">Login Petugas</span>
          <span className="text-xs text-teal-200 mt-1">Dashboard Pemanggil</span>
        </Link>
      </div>

      <div className="mt-8">
        <Link
          href="/admin"
          className="text-xs text-teal-300 hover:text-white underline font-mono"
        >
          ⚙️ Panel Admin / Reset Antrean Harian
        </Link>
      </div>
    </div>
  );
}
