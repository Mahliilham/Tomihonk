// ── Roles & Auth ─────────────────────────────────────────────────────────────
export type Role = "admin" | "teknisi" | "sales" | "user";

export type CurrentUser = {
  role: Role;
  name: string;
  id: string;
};

export type Account = {
  id: number | string;
  username: string;
  password: string;
  name: string;
  role: Role;
  staffId?: string;
};

// ── Customer Users (Akun Pelanggan) ──────────────────────────────────────────
export type CustomerUser = {
  id: number | string;
  username: string;
  name: string;
  email: string;
  hp: string;
  alamat: string;
  idPelanggan: string | null;
  status: "aktif" | "tidak_aktif";
  createdAt: string;
};

// ── Customers ────────────────────────────────────────────────────────────────
export type Customer = {
  id: number | string;
  nama: string;
  alamat: string;
  hp: string;
  paket: string;
};

// ── Paket ────────────────────────────────────────────────────────────────────
export type Paket = {
  id: number | string;
  nama: string;
  harga: number;
  kat: string;
  kecepatan?: string;
  deskripsi?: string;
};

// ── Titik ODP ────────────────────────────────────────────────────────────────
export type TitikODP = {
  id: number | string;
  kode: string;
  wilayah: string;
  alamat: string;
  koordinat?: string;
  kapasitas: number;
  terpakai: number;
  status: "tersedia" | "penuh" | "maintenance" | "rusak";
  keterangan?: string;
  createdAt?: string;
};

// ── Tickets ──────────────────────────────────────────────────────────────────
export type Ticket = {
  id: string;
  pel: string;
  hp: string;
  alm: string;
  jenis: "pemasangan" | "pemeliharaan" | "survey" | "dismantle";
  mas: string;
  pri: "Rendah" | "Sedang" | "Tinggi";
  tek: string;
  st: "pending" | "proses" | "selesai";
  tgl: string;
  tglSurvey?: string;
  estimasiMulai?: string;
  estimasiSelesai?: string;
  paket?: string;
};

// ── Calon Pelanggan ──────────────────────────────────────────────────────────
export type Calon = {
  id: number | string;
  nik: string;
  nama: string;
  alamat: string;
  hp: string;
  email: string;
  paket: string;
  sumber: string;
  ktp: string;
  rumah: string;
  tgl: string;
  status: "baru" | "diproses";
};

// ── Keluhan ──────────────────────────────────────────────────────────────────
export type Keluhan = {
  id: number | string;
  nama: string;
  pesan: string;
  tgl: string;
  status: "baru" | "diproses" | "selesai";
};

// ── Laporan (Teknisi) ────────────────────────────────────────────────────────
export type Laporan = {
  id: number | string;
  ticketId: string;
  jenis: string;
  pel: string;
  hp?: string;
  tek: string;
  tekName: string;
  tgl: string;
  paket: string;
  odp: string;
  titik: string;
  keterangan: string;
  ttd: string;
  rating: number;
  saranKritik?: string;
  fotoPemeliharaan?: string[];
  filePemeliharaan?: string;
  noPelanggan?: string;
  marketing?: string;
  serialONU?: string;
  macAddress?: string;
  panjangKabel?: string;
  redaman?: string;
  usernamePPPoE?: string;
  passwordPPPoE?: string;
  hasilSpeedtest?: string;
  statusKoneksi?: string;
  feedbackLinkSent?: boolean;
  feedbackLinkSentAt?: string;
};

// ── Survey Laporan (Sales) ───────────────────────────────────────────────────
export type SurveyLaporan = {
  id: number | string;
  ticketId: string;
  visitId?: string;
  calon: string;
  hp: string;
  alamat: string;
  salesName: string;
  kondisiLokasi: string;
  jarakOdp: string;
  sinyal: "kuat" | "sedang" | "lemah";
  minat: "sangat_minat" | "minat" | "ragu" | "tidak_minat";
  paketDiminati: string;
  catatan: string;
  fotoLokasi: string[];
  rekomendasi: "layak" | "perlu_review" | "tidak_layak";
  tglRencana: string;
  tgl: string;
  ttd?: string;
};

// ── Gallery ──────────────────────────────────────────────────────────────────
export type GalleryItem = {
  id: number | string;
  title: string;
  img: string;
};

// ── Sales Visits ─────────────────────────────────────────────────────────────
export type SalesVisit = {
  id: string;
  calon: string;
  hp: string;
  alamat: string;
  tujuan: string;
  catatan: string;
  st: "dijadwalkan" | "dikunjungi" | "selesai";
  hasil: string;
  sales: string;
  salesName: string;
  tgl: string;
};

// ── Notifications ────────────────────────────────────────────────────────────
export type NotifTarget = "admin" | "tech" | "sales";

export type Notif = {
  id: number;
  title: string;
  desc: string;
  time: number;
  read: boolean;
};

// ── Tagihan (Billing) ────────────────────────────────────────────────────────
export type Tagihan = {
  id: number | string;
  pelanggan: string;
  noTagihan: string;
  bulan: string;
  tahun: number;
  jumlah: number;
  jatuhTempo: string;
  status: "lunas" | "belum_bayar" | "dalam_proses" | "isolasi";
  metodeBayar?: string;
  tglLunas?: string;
  denda?: number;
};
