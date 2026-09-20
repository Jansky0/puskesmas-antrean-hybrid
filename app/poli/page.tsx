"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { printThermalTicket } from "@/lib/audioManager";

const poliRooms = [
  { code: "A", name: "Ruang Anak" },
  { code: "B", name: "Ruang Ibu" },
  { code: "C", name: "Ruang Klaster 3" },
  { code: "D", name: "Ruang Tindakan" },
  { code: "E", name: "Ruang KB" },
  { code: "F", name: "Ruang Imunisasi" },
  { code: "G", name: "Ruang Gigi & Mulut" },
  { code: "H", name: "Ruang USG" },
  { code: "I", name: "Ruang Farmasi" },
];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {poliRooms.map((room) => (
          <button
            key={room.code}
            onClick={() => generateTicket(room.code, room.name)}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border-2 border-teal-100 hover:border-teal-500 hover:shadow-2xl transition duration-200 text-center flex flex-col items-center justify-center min-h-[160px] active:scale-95"
          >
            <span className="text-5xl md:text-6xl font-black text-teal-600 block mb-3">{room.code}</span>
            <span className="text-xl md:text-2xl font-black text-slate-800 tracking-wide">{room.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
