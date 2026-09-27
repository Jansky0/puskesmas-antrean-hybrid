import Link from "next/link";

import { ALL_ROOMS } from "@/lib/rooms";

export default function PetugasIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center relative">
      <Link
        href="/"
        className="absolute top-6 left-6 bg-white hover:bg-slate-200 text-teal-900 font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 border border-slate-200"
      >
        ← Kembali ke Menu Utama
      </Link>
      <h1 className="text-3xl font-black text-slate-800 mb-8 mt-4">PILIH DASHBOARD RUANGAN PETUGAS</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {ALL_ROOMS.map((room) => (
          <Link
            key={room.code}
            href={`/petugas/${room.code}`}
            className="bg-white p-6 rounded-2xl shadow-md border hover:border-emerald-500 hover:shadow-xl transition text-center flex flex-col items-center justify-between"
          >
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase">
                Ruang {room.roomNo}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Kode: {room.code}
              </span>
            </div>
            <span className="text-4xl font-extrabold text-emerald-600 block mb-2">{room.code}</span>
            <span className="text-lg font-bold text-slate-700 leading-snug">{room.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
