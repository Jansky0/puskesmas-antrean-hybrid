"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { voiceManager } from "@/lib/audioManager";

export default function DisplayTVPage() {
  const [loketCall, setLoketCall] = useState({
    roomName: "LOKET PENDAFTARAN",
    ticketNumber: "---",
  });

  const [activePoliCall, setActivePoliCall] = useState("");

  const [rooms, setRooms] = useState([
    { code: "A", name: "Ruang Anak", currentTicket: "---" },
    { code: "B", name: "Ruang Ibu", currentTicket: "---" },
    { code: "C", name: "Ruang Klaster 3", currentTicket: "---" },
    { code: "D", name: "Ruang Tindakan", currentTicket: "---" },
    { code: "E", name: "Ruang KB", currentTicket: "---" },
    { code: "F", name: "Ruang Imunisasi", currentTicket: "---" },
    { code: "G", name: "Ruang Gigi & Mulut", currentTicket: "---" },
    { code: "H", name: "Ruang USG", currentTicket: "---" },
    { code: "I", name: "Ruang Farmasi", currentTicket: "---" },
  ]);

  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("id-ID", { hour12: false }));
    }, 1000);

    // Initial fetch for current active CALLING queues
    const fetchCurrentState = async () => {
      const { data } = await supabase
        .from("queues")
        .select("*")
        .eq("status", "CALLING")
        .order("called_at", { ascending: false });

      if (data && data.length > 0) {
        const latestLoket = data.find((q) => q.room_code === "LKT");
        if (latestLoket) {
          setLoketCall({
            roomName: latestLoket.room_name,
            ticketNumber: latestLoket.ticket_number,
          });
        }

        const roomMap: Record<string, string> = {};
        data.forEach((q) => {
          if (q.room_code !== "LKT" && !roomMap[q.room_code]) {
            roomMap[q.room_code] = q.ticket_number;
          }
        });

        setRooms((prev) =>
          prev.map((r) => (roomMap[r.code] ? { ...r, currentTicket: roomMap[r.code] } : r))
        );
      }
    };

    fetchCurrentState();

    const channel = supabase
      .channel("realtime_tv_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues" },
        (payload) => {
          const newQueue = payload.new as any;
          if (newQueue && newQueue.status === "CALLING") {
            if (newQueue.room_code === "LKT") {
              setLoketCall({
                roomName: newQueue.room_name,
                ticketNumber: newQueue.ticket_number,
              });
            } else {
              setActivePoliCall(newQueue.room_code);
              setRooms((prev) =>
                prev.map((r) =>
                  r.code === newQueue.room_code ? { ...r, currentTicket: newQueue.ticket_number } : r
                )
              );
            }

            // Jalankan suara pemanggilan otomatis
            voiceManager.speak(newQueue.ticket_number, newQueue.room_name);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="h-screen bg-teal-950 text-white flex flex-col justify-between p-4 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center bg-teal-900/60 p-4 rounded-2xl border border-teal-700/50 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="bg-teal-800 hover:bg-teal-700 text-teal-100 font-bold px-3.5 py-2 rounded-xl text-xs border border-teal-600 transition flex items-center gap-1.5"
          >
            ← Menu Utama
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-wider">PUSKESMAS PRAMBONTERGAYANG</h1>
            <p className="text-xs text-teal-300">SISTEM ANTREAN PELAYANAN TERPADU</p>
          </div>
        </div>
        <div className="text-3xl font-mono font-bold bg-teal-800/80 px-4 py-2 rounded-xl border border-teal-600">
          {time || "00.00.00"}
        </div>
      </div>

      {/* Main Content Area: Fill vertical space */}
      <div className="grid grid-cols-12 gap-5 flex-1 my-3 items-stretch">
        {/* Box Khusus Loket Pendaftaran (Kiri) */}
        <div className="col-span-5 bg-teal-700/40 rounded-3xl border-2 border-teal-400 p-6 flex flex-col justify-between text-center shadow-2xl h-full">
          <div className="bg-teal-600 font-extrabold py-3 text-2xl rounded-xl tracking-wider uppercase shrink-0">
            {loketCall.roomName}
          </div>
          <div className="text-9xl font-black my-auto tracking-tighter text-yellow-300">
            {loketCall.ticketNumber}
          </div>
          <div className="bg-slate-900/80 py-3 rounded-xl text-teal-200 font-semibold animate-pulse shrink-0">
            SILAKAN MENUJU LOKET PENDAFTARAN
          </div>
        </div>

        {/* Grid Status Ruang Poli (A-I): Flex 1 to fill height */}
        <div className="col-span-7 grid grid-cols-3 gap-4 h-full">
          {rooms.map((room) => {
            const isBeingCalled = activePoliCall === room.code;
            return (
              <div
                key={room.code}
                className={`rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between h-full ${
                  isBeingCalled
                    ? "bg-yellow-100 border-4 border-yellow-400 shadow-2xl scale-105 z-10 animate-bounce"
                    : "bg-white text-slate-900 shadow"
                }`}
              >
                <div
                  className={`text-center font-bold text-sm py-2.5 uppercase tracking-wide shrink-0 ${
                    isBeingCalled ? "bg-yellow-500 text-slate-950 font-black" : "bg-teal-600 text-white"
                  }`}
                >
                  {room.name}
                </div>
                <div
                  className={`text-center font-black text-6xl lg:text-7xl my-auto flex items-center justify-center h-full ${
                    isBeingCalled ? "text-teal-900 text-7xl lg:text-8xl scale-110" : "text-slate-800"
                  }`}
                >
                  {room.currentTicket}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Marquee */}
      <div className="bg-teal-900 p-3 rounded-xl border border-teal-700 flex items-center overflow-hidden shrink-0">
        <span className="bg-yellow-400 text-slate-900 font-bold px-3 py-1 rounded text-xs mr-4 shrink-0">
          INFORMASI
        </span>
        <div className="text-sm font-medium text-teal-100 overflow-hidden whitespace-nowrap animate-pulse">
          Selamat Datang di Puskesmas Prambontergayang. Utamakan Keselamatan dan Kesehatan Anda.
        </div>
      </div>
    </div>
  );
}
