"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [todayCount, setTodayCount] = useState(0);

  const fetchStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("queues")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    setTodayCount(count || 0);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const resetTodayQueue = async () => {
    const confirmReset = confirm(
      "Apakah Anda yakin ingin MERESET SEMUA ANTREAN HARI INI? Data antrean akan dihapus dari antrean aktif."
    );

    if (!confirmReset) return;

    const { error } = await supabase
      .from("queues")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (!error) {
      alert("Antrean berhasil di-reset untuk hari baru!");
      fetchStats();
      window.location.reload();
    } else {
      alert(`Gagal mereset antrean: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center justify-center relative">
      <Link
        href="/"
        className="absolute top-6 left-6 bg-white hover:bg-slate-200 text-teal-900 font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 border border-slate-200"
      >
        ← Kembali ke Menu Utama
      </Link>
      <div className="max-w-2xl w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200 mt-10">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">PANEL ADMIN & CONTROL ANTREAN</h1>
            <p className="text-xs text-slate-500">Puskesmas Prambontergayang</p>
          </div>
          <Link
            href="/"
            className="bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold px-4 py-2 rounded-xl border border-teal-300 transition flex items-center gap-2 text-sm shadow-sm"
          >
            ← Kembali ke Menu
          </Link>
        </div>

        <div className="bg-teal-50 border border-teal-200 p-6 rounded-2xl mb-8 flex justify-between items-center">
          <div>
            <span className="text-sm font-semibold text-teal-700 block">Total Antrean Terdaftar Hari Ini</span>
            <span className="text-4xl font-black text-teal-900">{todayCount} Pasien</span>
          </div>
          <button
            onClick={fetchStats}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition"
          >
            Refresh Data
          </button>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-bold text-red-600 mb-2">⚠️ Danger Zone / Reset Harian</h2>
          <p className="text-sm text-slate-500 mb-4">
            Gunakan tombol ini setiap pagi/awal hari kerja untuk mengosongkan antrean dan memulai nomor dari awal lagi.
          </p>
          <button
            onClick={resetTodayQueue}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow transition"
          >
            🔄 MERESET / KOSONGKAN SEMUA ANTREAN
          </button>

          <div className="mt-6 pt-4 border-t flex justify-center">
            <Link
              href="/"
              className="w-full text-center bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-6 rounded-2xl shadow transition flex items-center justify-center gap-2 text-base"
            >
              ← Kembali ke Menu Utama
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
