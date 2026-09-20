import Link from "next/link";

const poliRooms = [
  { code: "LKT", name: "Loket Pendaftaran" },
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
      <div className="grid grid-cols-3 gap-6 max-w-4xl w-full">
        {poliRooms.map((room) => (
          <Link
            key={room.code}
            href={`/petugas/${room.code}`}
            className="bg-white p-6 rounded-2xl shadow-md border hover:border-emerald-500 hover:shadow-xl transition text-center"
          >
            <span className="text-4xl font-extrabold text-emerald-600 block mb-2">{room.code}</span>
            <span className="text-lg font-bold text-slate-700">{room.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
