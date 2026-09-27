"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { printThermalTicket } from "@/lib/audioManager";

import { POLI_ROOMS } from "@/lib/rooms";

export default function CetakTiketPoliPage() {
  const generateTicket = async (roomCode: string, roomName: string) => {
    const today = new Date().toISOString().split("T")[0];

    // Ambil jumlah antrean untuk ruangan poli terkait hari ini
    const { count } = await supabase
      .from("queues")
      .select("*", { count: "exact", head: true })
      .eq("room_code", roomCode)
      .gte("created_at", today);

    const nextSeq = (count || 0) + 1;
    const ticketNumber = `${roomCode}${String(nextSeq).padStart(2, "0")}`;

    const { error } = await supabase.from("queues").insert([
      {
        ticket_number: ticketNumber,
        category: "POLI",
        room_code: roomCode,
        room_name: roomName,
        status: "WAITING",
      },
    ]);

    if (!error) {
      printThermalTicket(ticketNumber, roomName);
    } else {
      alert(`Gagal mengambil tiket: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 flex flex-col items-center relative">
      <Link
        href="/"
        className="absolute top-6 left-6 bg-white hover:bg-slate-200 text-teal-900 font-bold px-6 py-3 rounded-2xl shadow-md transition flex items-center gap-2 border border-slate-200 text-base z-10"
      >
        ← Kembali ke Menu
      </Link>
      <h1 className="text-3xl md:text-4xl font-black text-teal-900 mb-8 mt-6 text-center tracking-wide">
        ANJUNGAN CETAK TIKET POLI MANDIRI
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {POLI_ROOMS.map((room) => (
          <button
            key={room.code}
            onClick={() => generateTicket(room.code, room.name)}
            className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border-2 border-teal-100 hover:border-teal-500 hover:shadow-2xl transition duration-200 text-center flex flex-col items-center justify-between min-h-[220px] active:scale-95 group"
          >
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-black bg-teal-50 text-teal-800 px-3 py-1 rounded-full uppercase border border-teal-200">
                Ruang {room.roomNo}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Ketik / Sentuh
              </span>
            </div>
            <span className="text-5xl md:text-6xl font-black text-teal-600 block mb-2 group-hover:scale-110 transition duration-200">
              {room.code}
            </span>
            <span className="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-snug">
              {room.name}
            </span>
            <span className="mt-4 text-xs font-bold text-white bg-teal-600 group-hover:bg-teal-700 px-4 py-1.5 rounded-full transition w-full shadow-sm">
              Ambil Tiket ({room.code})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
