export interface RoomConfig {
  code: string;
  name: string;
  roomNo: number;
}

export const LOKET_ROOM: RoomConfig = {
  code: "LKT",
  name: "Loket Pendaftaran",
  roomNo: 1,
};

export const POLI_ROOMS: RoomConfig[] = [
  { code: "A", name: "Ruang Pelayanan Dewasa", roomNo: 2 },
  { code: "B", name: "Ruang Pelayanan Lansia", roomNo: 3 },
  { code: "C", name: "Ruang Pelayanan Ibu", roomNo: 4 },
  { code: "D", name: "Ruang Pelayanan Anak", roomNo: 5 },
  { code: "E", name: "Ruang Tindakan", roomNo: 6 },
  { code: "F", name: "Ruang Pelayanan KB", roomNo: 7 },
  { code: "G", name: "Ruang Pelayanan Imunisasi", roomNo: 8 },
  { code: "H", name: "Ruang Pelayanan Gigi", roomNo: 9 },
];

export const ALL_ROOMS: RoomConfig[] = [LOKET_ROOM, ...POLI_ROOMS];

export function getRoomByCode(code: string): RoomConfig | undefined {
  return ALL_ROOMS.find((r) => r.code.toUpperCase() === code.toUpperCase());
}
