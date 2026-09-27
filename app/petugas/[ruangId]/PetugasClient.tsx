"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getRoomByCode } from "@/lib/rooms";

export default function PetugasClient({ ruangId }: { ruangId: string }) {
  const roomConfig = getRoomByCode(ruangId);
  const [waitingQueues, setWaitingQueues] = useState<any[]>([]);
  const [currentCalling, setCurrentCalling] = useState<any | null>(null);
  const [skippedQueues, setSkippedQueues] = useState<any[]>([]);
  const [doneQueues, setDoneQueues] = useState<any[]>([]);
  const [showDoneHistory, setShowDoneHistory] = useState(false);

  const fetchQueues = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("queues")
      .select("*")
      .eq("room_code", ruangId)
      .gte("created_at", today)
      .order("created_at", { ascending: true });

    if (data) {
      // 1. Sedang dipanggil (CALLING) - ambil yang paling terakhir dipanggil
      const callingList = data
        .filter((q) => q.status === "CALLING")
        .sort((a, b) => new Date(b.called_at || 0).getTime() - new Date(a.called_at || 0).getTime());

      setCurrentCalling(callingList.length > 0 ? callingList[0] : null);

      // Sisa calling (jika ada lebih dari 1 akibat sesi ganda) digabung ke skipped
      const extraCalling = callingList.slice(1);

      // 2. Pasien Dilewati / Belum Datang (SKIPPED)
      const skippedList = [
        ...data.filter((q) => q.status === "SKIPPED"),
        ...extraCalling,
      ].sort((a, b) => new Date(b.called_at || 0).getTime() - new Date(a.called_at || 0).getTime());
      setSkippedQueues(skippedList);

      // 3. Menunggu (WAITING)
      const waitingList = data
        .filter((q) => q.status === "WAITING")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setWaitingQueues(waitingList);

      // 4. Selesai (DONE)
      const doneList = data
        .filter((q) => q.status === "DONE")
        .sort((a, b) => new Date(b.called_at || 0).getTime() - new Date(a.called_at || 0).getTime());
      setDoneQueues(doneList);
    }
  };

  useEffect(() => {
    fetchQueues();

    const channel = supabase
      .channel(`petugas_queues_${ruangId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, () => {
        fetchQueues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ruangId]);

  // 1. Panggil Pasien Baru dari Antrean Menunggu
  const callPatient = async (item: any) => {
    // Jika sebelumnya ada yang sedang dipanggil, simpan ke daftar dilewati agar tidak hilang
    if (currentCalling && currentCalling.id !== item.id) {
      await supabase
        .from("queues")
        .update({ status: "SKIPPED" })
        .eq("id", currentCalling.id);
    }

    const { error } = await supabase
      .from("queues")
      .update({
        status: "CALLING",
        called_at: new Date().toISOString(),
        call_count: (item.call_count || 0) + 1,
      })
      .eq("id", item.id);

    if (error) {
      alert(`Gagal memanggil pasien: ${error.message}`);
    } else {
      fetchQueues();
    }
  };

  // 2. Panggil Ulang Pasien (baik dari kotak aktif atau dari daftar dilewati)
  const recallPatient = async (item: any) => {
    // Jika memanggil ulang nomor dari daftar dilewati saat ada nomor lain aktif, amankan nomor aktif ke SKIPPED
    if (currentCalling && currentCalling.id !== item.id) {
      await supabase
        .from("queues")
        .update({ status: "SKIPPED" })
        .eq("id", currentCalling.id);
    }

    const { error } = await supabase
      .from("queues")
      .update({
        status: "CALLING",
        called_at: new Date().toISOString(),
        call_count: (item.call_count || 0) + 1,
      })
      .eq("id", item.id);

    if (error) {
      alert(`Gagal memanggil ulang pasien: ${error.message}`);
    } else {
      fetchQueues();
    }
  };

  // 3. Lewati Pasien (jika tidak ada orang / tidak menyahut saat dipanggil)
  const skipPatient = async (item: any) => {
    const { error } = await supabase
      .from("queues")
      .update({
        status: "SKIPPED",
      })
      .eq("id", item.id);

    if (error) {
      alert(`Gagal melewati antrean: ${error.message}`);
    } else {
      fetchQueues();
    }
  };

  // 4. Selesaikan Pasien (pasien hadir / pemeriksaan selesai)
  const completePatient = async (item: any) => {
    const { error } = await supabase
      .from("queues")
      .update({
        status: "DONE",
      })
      .eq("id", item.id);

    if (error) {
      alert(`Gagal menyelesaikan antrean: ${error.message}`);
    } else {
      fetchQueues();
    }
  };

  // 5. Kembalikan ke antrean reguler menunggu
  const restoreToWaiting = async (item: any) => {
    const { error } = await supabase
      .from("queues")
      .update({
        status: "WAITING",
      })
      .eq("id", item.id);

    if (error) {
      alert(`Gagal mengembalikan antrean: ${error.message}`);
    } else {
      fetchQueues();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 relative">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Dashboard Petugas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {roomConfig && (
                <span className="text-xs font-black bg-emerald-600 text-white px-3 py-1 rounded-full uppercase tracking-wider">
                  Ruang {roomConfig.roomNo}
                </span>
              )}
              <span className="text-xs font-black bg-slate-100 text-slate-700 px-3 py-1 rounded-full uppercase tracking-wider">
                Kode Poli: {ruangId}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Puskesmas Prambontergayang
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {roomConfig ? roomConfig.name : `Ruangan ${ruangId}`}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <Link
              href="/"
              className="bg-white hover:bg-slate-100 text-teal-900 font-bold px-4 py-2.5 rounded-2xl shadow-sm transition border border-slate-200 text-xs md:text-sm flex items-center gap-1.5"
            >
              ← Menu Utama
            </Link>
            <Link
              href="/petugas"
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-2xl shadow-sm transition text-xs md:text-sm flex items-center gap-1.5"
            >
              ← Ganti Ruangan
            </Link>
          </div>
        </div>

        {/* Ringkasan Status Antrean Hari Ini */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
              Antrean Menunggu
            </span>
            <span className="text-2xl md:text-3xl font-black text-teal-900">
              {waitingQueues.length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
              Dilewati / Panggil Ulang
            </span>
            <span className="text-2xl md:text-3xl font-black text-amber-900">
              {skippedQueues.length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              Selesai Dilayani
            </span>
            <span className="text-2xl md:text-3xl font-black text-emerald-900">
              {doneQueues.length}
            </span>
          </div>
        </div>

        {/* SECTION 1: KARTU PASIEN SEDANG DIPANGGIL */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 rounded-3xl p-6 md:p-8 border-2 border-amber-400 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <h2 className="text-lg md:text-xl font-black text-amber-950 uppercase tracking-wide">
                PASIEN SEDANG DIPANGGIL SAAT INI
              </h2>
            </div>
            {currentCalling && (
              <span className="text-xs font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-full uppercase animate-pulse">
                Aktif di Layar TV & Suara
              </span>
            )}
          </div>

          {currentCalling ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-amber-300 shadow-sm">
                <div className="text-center md:text-left">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nomor Antrean
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-amber-600 tracking-tight">
                    {currentCalling.ticket_number}
                  </div>
                </div>

                <div className="text-center md:text-right space-y-1">
                  <div className="text-sm font-extrabold text-slate-700">
                    {currentCalling.room_name}
                  </div>
                  <div className="text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-block">
                    📢 Sudah Dipanggil: {currentCalling.call_count || 1} kali
                  </div>
                  <div className="text-xs text-slate-400">
                    Panggilan Terakhir: {currentCalling.called_at ? new Date(currentCalling.called_at).toLocaleTimeString() : "-"}
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Pasien Aktif */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => recallPatient(currentCalling)}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black py-4 px-4 rounded-2xl shadow-md hover:shadow-xl transition flex items-center justify-center gap-2 text-base md:text-lg border-b-4 border-amber-700"
                >
                  <span className="text-2xl">🔊</span>
                  <span>PANGGIL ULANG</span>
                </button>

                <button
                  onClick={() => completePatient(currentCalling)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black py-4 px-4 rounded-2xl shadow-md hover:shadow-xl transition flex items-center justify-center gap-2 text-base md:text-lg border-b-4 border-emerald-800"
                >
                  <span className="text-2xl">✅</span>
                  <span>PASIEN HADIR / SELESAI</span>
                </button>

                <button
                  onClick={() => skipPatient(currentCalling)}
                  className="bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 active:scale-98 font-bold py-4 px-4 rounded-2xl border-2 border-slate-300 hover:border-rose-300 transition flex flex-col items-center justify-center text-sm"
                >
                  <span className="flex items-center gap-1.5 font-black text-base">
                    <span>⏭️</span> LEWATI / TIDAK ADA
                  </span>
                  <span className="text-[11px] text-slate-400">Simpan ke daftar panggil ulang</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 p-8 rounded-2xl text-center text-slate-500 border border-dashed border-amber-300">
              <span className="text-4xl block mb-2">🔔</span>
              <p className="font-bold text-slate-700 text-base">Belum ada pasien yang sedang dipanggil.</p>
              <p className="text-xs text-slate-400 mt-1">
                Silakan panggil pasien dari daftar antrean menunggu di bawah, atau panggil ulang pasien yang sempat dilewati.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 2: DAFTAR PASIEN DILEWATI / BELUM DATANG (BISA PANGGIL ULANG KAPAN SAJA) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-orange-200 shadow-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <h2 className="text-lg md:text-xl font-black text-slate-800">
                  DAFTAR PASIEN DILEWATI / BELUM DATANG ({skippedQueues.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pasien yang tadi tidak menyahut tersimpan di sini. Klik tombol <b>"🔊 Panggil Ulang"</b> saat orangnya sudah tiba di ruangan.
              </p>
            </div>
          </div>

          {skippedQueues.length === 0 ? (
            <div className="bg-slate-50 p-6 rounded-2xl text-center text-slate-400 text-sm font-medium border border-dashed border-slate-200">
              Tidak ada pasien yang dilewati saat ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skippedQueues.map((item) => (
                <div
                  key={item.id}
                  className="bg-orange-50/60 p-5 rounded-2xl border-2 border-orange-200 flex flex-col justify-between hover:border-orange-400 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-3xl font-black text-slate-900 block tracking-tight">
                        {item.ticket_number}
                      </span>
                      <span className="text-xs text-slate-500">
                        Ambil tiket: {new Date(item.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-xs font-black bg-orange-200 text-orange-950 px-2.5 py-1 rounded-full uppercase">
                      Dilewati ({item.call_count || 1}x panggil)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-orange-100">
                    <button
                      onClick={() => recallPatient(item)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 px-3 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 text-sm active:scale-95"
                    >
                      <span>🔊</span> Panggil Ulang
                    </button>
                    <button
                      onClick={() => completePatient(item)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center gap-1 active:scale-95"
                      title="Tandai pasien ini sudah hadir dan selesai"
                    >
                      <span>✅</span> Hadir
                    </button>
                    <button
                      onClick={() => restoreToWaiting(item)}
                      className="bg-white hover:bg-slate-100 text-slate-600 font-semibold py-2.5 px-2.5 rounded-xl border border-slate-200 transition text-xs"
                      title="Kembalikan ke antrean reguler menunggu"
                    >
                      ↩️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: ANTREAN MENUNGGU (REGULER) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                <h2 className="text-lg md:text-xl font-black text-slate-800">
                  ANTREAN MENUNGGU ({waitingQueues.length} Pasien)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pasien baru yang siap dipanggil pertama kali.
              </p>
            </div>

            {waitingQueues.length > 0 && (
              <button
                onClick={() => callPatient(waitingQueues[0])}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl shadow transition text-sm flex items-center gap-2 active:scale-95"
              >
                <span>📢</span> Panggil Berikutnya ({waitingQueues[0].ticket_number})
              </button>
            )}
          </div>

          {waitingQueues.length === 0 ? (
            <div className="bg-slate-50 p-8 rounded-2xl text-center text-slate-400 text-sm font-medium border border-dashed border-slate-200">
              Tidak ada antrean yang menunggu saat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {waitingQueues.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-50 hover:bg-emerald-50/50 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-3xl font-black text-slate-900 block leading-tight">
                        {item.ticket_number}
                      </span>
                      <p className="text-xs text-slate-400">
                        Waktu Cetak: {new Date(item.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => callPatient(item)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl shadow-sm transition text-sm flex items-center gap-1.5 active:scale-95"
                  >
                    <span>📢</span> Panggil Pasien
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: RIWAYAT PASIEN SELESAI HARI INI */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <button
            onClick={() => setShowDoneHistory(!showDoneHistory)}
            className="w-full flex items-center justify-between text-left font-black text-slate-700 hover:text-slate-900 text-base"
          >
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>Riwayat Pasien Selesai Hari Ini ({doneQueues.length} Pasien)</span>
            </div>
            <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full">
              {showDoneHistory ? "▲ Tutup" : "▼ Lihat Riwayat"}
            </span>
          </button>

          {showDoneHistory && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              {doneQueues.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Belum ada pasien yang selesai hari ini.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {doneQueues.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs"
                    >
                      <span className="font-black text-slate-800 text-base block">{item.ticket_number}</span>
                      <span className="text-[10px] text-emerald-600 font-bold block">Selesai Dilayani</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
