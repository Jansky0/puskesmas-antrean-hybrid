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
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center relative">
      <Link
        href="/"
        className="absolute top-6 left-6 bg-white hover:bg-slate-200 text-teal-900 font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 border border-slate-200"
      >
        ← Kembali ke Menu
      </Link>
      <h1 className="text-3xl font-black text-teal-900 mb-8 mt-4">ANJUNGAN CETAK TIKET POLI MANDIRI</h1>
      <div className="grid grid-cols-3 gap-6 max-w-5xl w-full">
        {poliRooms.map((room) => (
          <button
            key={room.code}
            onClick={() => generateTicket(room.code, room.name)}
            className="bg-white p-6 rounded-3xl shadow-md border hover:border-teal-500 hover:shadow-xl transition text-center"
          >
            <span className="text-4xl font-extrabold text-teal-600 block mb-2">{room.code}</span>
            <span className="text-xl font-bold text-slate-800">{room.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
