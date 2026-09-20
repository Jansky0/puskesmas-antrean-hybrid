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
        className="absolute top-6 left-6 bg-white hover:bg-slate-200 text-teal-900 font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 border border-slate-200"
      >
        ← Kembali ke Menu
      </Link>
      <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg w-full border border-teal-100">
        <h1 className="text-3xl font-black text-teal-900 mb-2">ANJUNGAN LOKET PENDAFTARAN</h1>
        <p className="text-slate-500 mb-8">Tekan tombol di bawah untuk mengambil nomor antrean pendaftaran</p>
        <button
          onClick={generateTicket}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-2xl py-6 rounded-2xl shadow-lg hover:shadow-2xl transition duration-200"
        >
          AMBIL NOMOR ANTREAN
        </button>
      </div>
    </div>
  );
}
