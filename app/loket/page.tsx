"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { printThermalTicket } from "@/lib/audioManager";

export default function CetakLoketPage() {
  const generateTicket = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Ambil jumlah antrean loket hari ini untuk menentukan nomor berikutnya
    const { count } = await supabase
      .from("queues")
      .select("*", { count: "exact", head: true })
      .eq("room_code", "LKT")
      .gte("created_at", today);

    const nextSeq = (count || 0) + 1;
    const ticketNumber = `L${String(nextSeq).padStart(2, "0")}`;

    const { error } = await supabase.from("queues").insert([
      {
        ticket_number: ticketNumber,
        category: "LOKET",
        room_code: "LKT",
        room_name: "LOKET PENDAFTARAN",
        status: "WAITING",
      },
    ]);

    if (!error) {
      printThermalTicket(ticketNumber, "LOKET PENDAFTARAN");
    } else {
      alert(`Gagal mengambil tiket: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 bg-white hover:bg-slate-200 text-teal-900 font-bold px-6 py-3 rounded-2xl shadow-md transition flex items-center gap-2 border border-slate-200 text-base z-10"
      >
        ← Kembali ke Menu
      </Link>
      <div className="bg-white p-10 md:p-16 rounded-3xl shadow-2xl text-center max-w-3xl w-full border-2 border-teal-200 flex flex-col items-center">
        <span className="bg-teal-100 text-teal-900 font-extrabold text-sm px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
          Puskesmas Prambontergayang
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-teal-950 mb-4 tracking-tight leading-tight">
          ANJUNGAN LOKET PENDAFTARAN
        </h1>
        <p className="text-slate-600 text-xl md:text-2xl font-bold mb-10 max-w-xl">
          Tekan tombol di bawah untuk mengambil nomor antrean pendaftaran
        </p>
        
        <button
          onClick={generateTicket}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-3xl md:text-4xl py-14 md:py-16 rounded-3xl shadow-xl hover:shadow-2xl transition duration-200 flex flex-col items-center justify-center gap-4 active:scale-98 border-2 border-teal-400"
        >
          <span className="text-6xl">🎟️</span>
          <span>AMBIL NOMOR ANTREAN</span>
        </button>
      </div>
    </div>
  );
}
