"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getRoomByCode } from "@/lib/rooms";

export default function PetugasClient({ ruangId }: { ruangId: string }) {
  const roomConfig = getRoomByCode(ruangId);
  const [queues, setQueues] = useState<any[]>([]);

  const fetchQueues = async () => {
    const { data } = await supabase
      .from("queues")
      .select("*")
      .eq("room_code", ruangId)
      .eq("status", "WAITING")
      .order("created_at", { ascending: true });

    if (data) setQueues(data);
  };

  useEffect(() => {
    fetchQueues();

    const channel = supabase
      .channel("petugas_queues")
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, () => {
        fetchQueues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ruangId]);

  const callPatient = async (item: any) => {
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

  return (
    <div className="min-h-screen bg-slate-100 p-6 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {roomConfig && (
                <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase">
                  Ruang {roomConfig.roomNo}
                </span>
              )}
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dashboard Pemanggil Petugas
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800">
              {roomConfig ? roomConfig.name : `Ruangan ${ruangId}`} ({ruangId})
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="bg-white hover:bg-slate-200 text-teal-900 font-bold px-4 py-2 rounded-xl shadow-sm transition border border-slate-200 text-sm flex items-center gap-2"
            >
              ← Menu Utama
            </Link>
            <Link
              href="/petugas"
              className="bg-white hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl shadow-sm transition border border-slate-200 text-sm flex items-center gap-2"
            >
              ← Pilih Ruangan
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          {queues.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-500 font-medium">
              Tidak ada antrean aktif saat ini.
            </div>
          ) : (
            queues.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-slate-800">{item.ticket_number}</span>
                  <p className="text-xs text-slate-400">Diambil: {new Date(item.created_at).toLocaleTimeString()}</p>
                </div>
                <button
                  onClick={() => callPatient(item)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow transition"
                >
                  Panggil Pasien
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
