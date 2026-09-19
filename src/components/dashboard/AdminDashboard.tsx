import { useMemo, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { fmtRp, StarsStatic } from "@/lib/format";
import PaketModal from "@/components/modals/PaketModal";
import TicketModal from "@/components/modals/TicketModal";
import ODPModal from "@/components/modals/ODPModal";
import NotifPanel from "@/components/dashboard/NotifPanel";
import type { Calon, Paket, Role, SurveyLaporan, Tagihan, Ticket, TitikODP } from "@/lib/types";
import * as XLSX from "xlsx";
import { downloadPdfPemasangan, downloadPdfPemeliharaan, downloadPdfSurvey } from "@/lib/pdfLaporan";

type Tab = "dashboard" | "paket" | "tiket" | "calon" | "keluhan" | "laporan" | "galeri" | "akun" | "tagihan" | "akun_user" | "odp";

const TABS: { k: Tab; ic: string; l: string }[] = [
  { k: "dashboard", ic: "fa-tachometer-alt", l: "Dashboard" },
  { k: "paket", ic: "fa-box", l: "Paket" },
  { k: "tiket", ic: "fa-ticket-alt", l: "Penugasan" },
  { k: "calon", ic: "fa-user-plus", l: "Calon Pelanggan" },
  { k: "keluhan", ic: "fa-comment-dots", l: "Keluhan" },
  { k: "laporan", ic: "fa-file-alt", l: "Laporan" },
  { k: "galeri", ic: "fa-images", l: "Galeri" },
  // { k: "tagihan", ic: "fa-wallet", l: "Tagihan" },
  { k: "akun", ic: "fa-users-cog", l: "Akun Staff" },
  { k: "akun_user", ic: "fa-users", l: "Akun User / Pelanggan" },
  { k: "odp", ic: "fa-network-wired", l: "Titik ODP" },
];

const stBadge = (s: string) => ({
  pending: "badge-warning", proses: "badge-info", selesai: "badge-success",
  baru: "badge-warning", ditangani: "badge-info", diproses: "badge-info",
}[s] || "badge-info");

// ── Export Excel helper ──
function exportToExcel(data: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── Konstanta nama bulan ──
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// ── Helper filter berdasarkan tanggal, bulan & tahun dari string tgl ──
function filterByDate<T extends { tgl: string }>(list: T[], bulan: string, tahun: string, tanggal?: string): T[] {
  return list.filter((item) => {
    let y = "", m = "", d = "";
    if (item.tgl) {
      const parts = item.tgl.split(/[-/ ]/);
      if (parts.length >= 3) {
        if (parts[0].length === 4) {
          [y, m, d] = parts;
        } else {
          [d, m, y] = parts;
        }
        d = d.substring(0, 2);
        y = y.substring(0, 4);
      }
    }
    if (tahun && y !== tahun) return false;
    if (bulan && m !== bulan) return false;
    if (tanggal && d !== tanggal) return false;
    return true;
  });
}

// ── Komponen UI filter tanggal/bulan/tahun ──
function FilterDate({
  tanggal, bulan, tahun, onChange, showTanggal = false,
}: { tanggal?: string; bulan: string; tahun: string; onChange: (d: string, b: string, t: string) => void; showTanggal?: boolean }) {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(thisYear - i));
  const dates = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <i className="fas fa-filter" style={{ color: "var(--th-muted,#6c757d)", fontSize: ".85rem" }} />
      {showTanggal && (
        <select
          value={tanggal || ""}
          onChange={(e) => onChange(e.target.value, bulan, tahun)}
          style={{
            padding: "5px 10px", borderRadius: 8, border: "1px solid var(--th-border,#dee2e6)",
            fontSize: ".82rem", background: "var(--th-surface,#fff)", cursor: "pointer",
            color: "var(--th-text,#212529)", outline: "none",
          }}
        >
          <option value="">Semua Tanggal</option>
          {dates.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      <select
        value={bulan}
        onChange={(e) => onChange(tanggal || "", e.target.value, tahun)}
        style={{
          padding: "5px 10px", borderRadius: 8, border: "1px solid var(--th-border,#dee2e6)",
          fontSize: ".82rem", background: "var(--th-surface,#fff)", cursor: "pointer",
          color: "var(--th-text,#212529)", outline: "none",
        }}
      >
        <option value="">Semua Bulan</option>
        {NAMA_BULAN.map((n, i) => (
          <option key={i} value={String(i + 1).padStart(2, "0")}>{n}</option>
        ))}
      </select>
      <select
        value={tahun}
        onChange={(e) => onChange(tanggal || "", bulan, e.target.value)}
        style={{
          padding: "5px 10px", borderRadius: 8, border: "1px solid var(--th-border,#dee2e6)",
          fontSize: ".82rem", background: "var(--th-surface,#fff)", cursor: "pointer",
          color: "var(--th-text,#212529)", outline: "none",
        }}
      >
        <option value="">Semua Tahun</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      {(tanggal || bulan || tahun) && (
        <button
          onClick={() => onChange("", "", String(thisYear))}
          style={{
            padding: "5px 10px", borderRadius: 8, border: "1px solid var(--th-border,#dee2e6)",
            fontSize: ".78rem", background: "transparent", cursor: "pointer",
            color: "var(--th-muted,#6c757d)", display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <i className="fas fa-times" /> Reset
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const {
    currentUser, logout, paketList, deletePaket,
    tickets, refreshTickets, deleteTicket, calon, prosesCalon, deleteCalon,
    keluhan, cycleKeluhan, laporan, surveyLaporan, notifications,
    gallery, addGallery, editGallery, deleteGallery,
    accounts, addAccount, editAccount, deleteAccount,
    tagihanList, addTagihan, updateTagihan, deleteTagihan, tandaiLunas, markTagihanOverdue,
    konversiCalonToTicket,
    customerUsers, activateUser, deactivateUser, deleteCustomerUser, refreshCustomerUsers,
    odpList, saveODP, deleteODP, refreshODP,
  } = useApp();

  const [tab, setTabRaw] = useState<Tab>(
    () => (localStorage.getItem("admin_tab") as Tab | null) || "dashboard"
  );
  const setTab = (t: Tab) => { setTabRaw(t); localStorage.setItem("admin_tab", t); if (t === "tiket") refreshTickets(); };

  const [notifOpen, setNotifOpen] = useState(false);
  const [paketModal, setPaketModal] = useState<{ open: boolean; editing: Paket | null }>({ open: false, editing: null });
  const [ticketModal, setTicketModal] = useState<{ open: boolean; from: Calon | null; isSales?: boolean }>({ open: false, from: null, isSales: false });
  const [detailLaporan, setDetailLaporan] = useState<typeof laporan[0] | null>(null);
  const [detailSurveyLap, setDetailSurveyLap] = useState<SurveyLaporan | null>(null);

  const [lapFilter, setLapFilterRaw] = useState<"teknisi" | "sales">(
    () => (localStorage.getItem("admin_lapFilter") as "teknisi" | "sales" | null) || "teknisi"
  );
  const setLapFilter = (v: "teknisi" | "sales") => { setLapFilterRaw(v); localStorage.setItem("admin_lapFilter", v); };

  const [tiketFilter, setTiketFilterRaw] = useState<"teknisi" | "sales">(
    () => (localStorage.getItem("admin_tiketFilter") as "teknisi" | "sales" | null) || "teknisi"
  );
  const setTiketFilter = (v: "teknisi" | "sales") => { setTiketFilterRaw(v); localStorage.setItem("admin_tiketFilter", v); };

  // ── Filter bulan/tahun ──
  const thisYear = String(new Date().getFullYear());
  const [tiketBulan, setTiketBulan] = useState("");
  const [tiketTahun, setTiketTahun] = useState(thisYear);
  const [calonBulan, setCalonBulan] = useState("");
  const [calonTahun, setCalonTahun] = useState(thisYear);
  const [lapTanggal, setLapTanggal] = useState("");
  const [lapBulan, setLapBulan] = useState("");
  const [lapTahun, setLapTahun] = useState(thisYear);

  // Tagihan state
  const [tagihanModal, setTagihanModal] = useState<{ open: boolean; editing: Tagihan | null }>({ open: false, editing: null });
  const [tagihanBulan, setTagihanBulan] = useState("");
  const [tagihanTahun, setTagihanTahun] = useState(thisYear);

  // Gallery upload/edit state
  const fileRef = useRef<HTMLInputElement>(null);
  const [galTitle, setGalTitle] = useState("");
  const [editGalId, setEditGalId] = useState<string | null>(null);

  // ODP Modal & filter state
  const [odpModal, setOdpModal] = useState<{ open: boolean; editing: TitikODP | null }>({ open: false, editing: null });
  const [odpFilterWilayah, setOdpFilterWilayah] = useState("semua");
  const [odpFilterStatus, setOdpFilterStatus] = useState("semua");
  const [odpSearchQuery, setOdpSearchQuery] = useState("");

  const odpWilayahOptions = useMemo(() => {
    const setW = new Set<string>();
    odpList.forEach((o) => { if (o.wilayah) setW.add(o.wilayah); });
    return Array.from(setW).sort();
  }, [odpList]);

  const filteredODP = useMemo(() => {
    return odpList.filter((o) => {
      const matchWilayah = odpFilterWilayah === "semua" || o.wilayah === odpFilterWilayah;
      const matchStatus = odpFilterStatus === "semua" || o.status === odpFilterStatus;
      const q = odpSearchQuery.toLowerCase();
      const matchQuery =
        !q ||
        o.kode.toLowerCase().includes(q) ||
        o.wilayah.toLowerCase().includes(q) ||
        o.alamat.toLowerCase().includes(q) ||
        (o.keterangan && o.keterangan.toLowerCase().includes(q)) ||
        (o.koordinat && o.koordinat.toLowerCase().includes(q));

      return matchWilayah && matchStatus && matchQuery;
    });
  }, [odpList, odpFilterWilayah, odpFilterStatus, odpSearchQuery]);

  const odpStats = useMemo(() => {
    const total = odpList.length;
    const totalKap = odpList.reduce((acc, o) => acc + (o.kapasitas || 0), 0);
    const totalTer = odpList.reduce((acc, o) => acc + (o.terpakai || 0), 0);
    const totalSisa = Math.max(0, totalKap - totalTer);
    const penuh = odpList.filter((o) => o.status === "penuh" || o.terpakai >= o.kapasitas).length;
    const maintenance = odpList.filter((o) => o.status === "maintenance" || o.status === "rusak").length;
    const tersedia = odpList.filter((o) => o.status === "tersedia" && o.terpakai < o.kapasitas).length;
    return { total, totalKap, totalTer, totalSisa, penuh, maintenance, tersedia };
  }, [odpList]);

  const exportODP = () => {
    const data = filteredODP.map((o) => ({
      "Kode ODP": o.kode,
      Wilayah: o.wilayah,
      Alamat: o.alamat,
      "Koordinat GPS": o.koordinat || "-",
      "Kapasitas Port": o.kapasitas,
      "Port Terpakai": o.terpakai,
      "Sisa Port": Math.max(0, o.kapasitas - o.terpakai),
      "% Penggunaan": `${Math.round((o.terpakai / (o.kapasitas || 1)) * 100)}%`,
      Status: o.status.toUpperCase(),
      Keterangan: o.keterangan || "-",
      "Tanggal Input": o.createdAt || "-",
    }));
    exportToExcel(data, `titik_odp_tomihonk_${new Date().toISOString().slice(0, 10)}`);
  };

  // Account form state
  const [accForm, setAccForm] = useState({ username: "", password: "", name: "", role: "teknisi" as Role });
  const [editAccId, setEditAccId] = useState<number | string | null>(null);
  const [showAccPass, setShowAccPass] = useState(false);

  const [userFilterStatus, setUserFilterStatus] = useState<"semua" | "aktif" | "tidak_aktif">("semua");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const filteredCustomerUsers = useMemo(() => {
    return customerUsers.filter((u) => {
      const matchStatus =
        userFilterStatus === "semua"
          ? true
          : userFilterStatus === "aktif"
          ? u.status === "aktif" || Boolean(u.idPelanggan)
          : u.status !== "aktif" && !u.idPelanggan;

      const q = userSearchQuery.toLowerCase();
      const matchQuery =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.hp && u.hp.toLowerCase().includes(q)) ||
        (u.alamat && u.alamat.toLowerCase().includes(q)) ||
        (u.idPelanggan && u.idPelanggan.toLowerCase().includes(q));

      return matchStatus && matchQuery;
    });
  }, [customerUsers, userFilterStatus, userSearchQuery]);

  const userStats = useMemo(() => {
    const total = customerUsers.length;
    const aktif = customerUsers.filter((u) => u.status === "aktif" || u.idPelanggan).length;
    const belum = total - aktif;
    return { total, aktif, belum };
  }, [customerUsers]);

  const unread = notifications.admin.filter((n) => !n.read).length;
  const stats = useMemo(() => ({
    paket: paketList.length,
    tiket: tickets.filter((t) => t.st !== "selesai").length,
    calon: calon.filter((c) => c.status === "baru").length,
    keluhan: keluhan.filter((k) => k.status !== "selesai").length,
    laporan: laporan.length,
  }), [paketList, tickets, calon, keluhan, laporan]);

  // ── Gallery handler ──
  const handleGallerySubmit = () => {
    if (!galTitle.trim()) return;
    
    if (editGalId) {
      editGallery(editGalId, galTitle.trim());
      setEditGalId(null);
      setGalTitle("");
      return;
    }

    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addGallery(galTitle.trim(), reader.result as string);
      setGalTitle("");
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const startEditGallery = (g: typeof gallery[0]) => {
    setEditGalId(String(g.id));
    setGalTitle(g.title);
  };

  // ── Account handler ──
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      username: accForm.username,
      password: accForm.password,
      name: accForm.name,
      role: accForm.role,
      // staffId akan di-generate otomatis oleh backend
    };
    
    if (editAccId) {
      editAccount(editAccId, data);
      setEditAccId(null);
    } else {
      addAccount(data);
    }
    setAccForm({ username: "", password: "", name: "", role: "teknisi" });
  };

  const startEditAccount = (a: typeof accounts[0]) => {
    setEditAccId(a.id);
    setAccForm({
      username: a.username,
      password: a.password,
      name: a.name,
      role: a.role,
    });
  };

  // ── Export handlers ──
  // (dipindahkan ke atas bersama tiketFilter)

  // ── Data tiket terfilter ──
  const tiketTeknisiFiltered = useMemo(() =>
    filterByDate(tickets.filter((t) => t.jenis !== "survey"), tiketBulan, tiketTahun),
    [tickets, tiketBulan, tiketTahun]
  );
  const tiketSalesFiltered = useMemo(() =>
    filterByDate(tickets.filter((t) => t.jenis === "survey"), tiketBulan, tiketTahun),
    [tickets, tiketBulan, tiketTahun]
  );
  const calonFiltered = useMemo(() =>
    filterByDate(calon, calonBulan, calonTahun),
    [calon, calonBulan, calonTahun]
  );
  const laporanFiltered = useMemo(() =>
    filterByDate(laporan, lapBulan, lapTahun, lapTanggal),
    [laporan, lapTanggal, lapBulan, lapTahun]
  );
  const surveyLaporanFiltered = useMemo(() =>
    filterByDate(surveyLaporan, lapBulan, lapTahun, lapTanggal),
    [surveyLaporan, lapTanggal, lapBulan, lapTahun]
  );

  const exportTiket = () => {
    const filtered = tiketFilter === "sales" ? tiketSalesFiltered : tiketTeknisiFiltered;
    const labelBulan = tiketBulan ? `_${NAMA_BULAN[+tiketBulan - 1]}` : "";
    const labelTahun = tiketTahun ? `_${tiketTahun}` : "";
    const data = filtered.map((t) => ({
      ID: t.id, Pelanggan: t.pel, HP: t.hp, Alamat: t.alm,
      Jenis: t.jenis, Masalah: t.mas, Prioritas: t.pri,
      "Estimasi Mulai": t.estimasiMulai || "-",
      "Estimasi Selesai": t.estimasiSelesai || "-",
      Status: t.st,
      [tiketFilter === "sales" ? "Sales" : "Teknisi"]: t.tek,
      Tanggal: t.tgl,
    }));
    exportToExcel(data, `tiket_${tiketFilter === "sales" ? "sales" : "teknisi"}${labelBulan}${labelTahun}`);
  };

  const exportCalon = () => {
    const labelBulan = calonBulan ? `_${NAMA_BULAN[+calonBulan - 1]}` : "";
    const labelTahun = calonTahun ? `_${calonTahun}` : "";
    const data = calonFiltered.map((c) => ({
      Tanggal: c.tgl, NIK: c.nik || "", Nama: c.nama, HP: c.hp,
      Email: c.email || "", Alamat: c.alamat, Paket: c.paket,
      Sumber: c.sumber || "", Status: c.status,
    }));
    exportToExcel(data, `calon_pelanggan${labelBulan}${labelTahun}`);
  };

  const exportLaporan = () => {
    const isSales = lapFilter === "sales";
    const labelBulan = lapBulan ? `_${NAMA_BULAN[+lapBulan - 1]}` : "";
    const labelTahun = lapTahun ? `_${lapTahun}` : "";
    if (isSales) {
      const data = surveyLaporanFiltered.map((l) => ({
        Tanggal: l.tgl,
        "ID Tiket": l.ticketId,
        "Calon Pelanggan": l.calon,
        HP: l.hp,
        Alamat: l.alamat,
        Sinyal: l.sinyal,
        Minat: l.minat,
        Rekomendasi: l.rekomendasi,
        Sales: l.salesName,
        Catatan: l.catatan || "",
      }));
      exportToExcel(data, `laporan_survey_sales${labelBulan}${labelTahun}`);
    } else {
      const data = laporanFiltered.map((l) => ({
        Tanggal: l.tgl,
        "ID Tiket": l.ticketId,
        Pelanggan: l.pel,
        Jenis: l.jenis,
        Teknisi: l.tekName,
        Rating: l.rating,
        Keterangan: l.keterangan || "",
      }));
      exportToExcel(data, `laporan_teknisi${labelBulan}${labelTahun}`);
    }
  };

  return (
    <div className="dashboard" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className="dash-topbar">
        <div className="th-logo"><i className="fas fa-wifi" /> Tomihonk Admin</div>
        <div className="dash-user">
          <div className="notif-btn" onClick={() => setNotifOpen((v) => !v)}>
            <i className="fas fa-bell" />
            {unread > 0 && <span className="notif-dot">{unread}</span>}
          </div>
          <div className="dash-user-info">
            <h5>{currentUser?.name}</h5>
            <p>Admin Panel</p>
          </div>
          <div className="dash-avatar">{currentUser?.name.charAt(0)}</div>
          <button className="th-btn th-btn-outline th-btn-sm" onClick={logout}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
        <NotifPanel target="admin" open={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>
      <div className="dash-body">
        <aside className="th-sidebar">
          <ul className="sidebar-menu">
            {TABS.map((t) => (
              <li key={t.k}>
                <a className={tab === t.k ? "active" : ""} onClick={() => setTab(t.k)}>
                  <i className={`fas ${t.ic}`} /><span>{t.l}</span>
                </a>
                {/* Sub-menu filter Tiket */}
                {t.k === "tiket" && tab === "tiket" && (
                  <ul style={{ listStyle: "none", margin: "2px 0 4px", padding: "0 0 0 12px" }}>
                    {([
                      { v: "teknisi", ic: "fa-tools", l: "Teknisi", count: tickets.filter((tk) => tk.jenis !== "survey").length },
                      { v: "sales",   ic: "fa-map-marked-alt", l: "Sales (Survey)", count: tickets.filter((tk) => tk.jenis === "survey").length },
                    ] as const).map((sub) => (
                      <li key={sub.v}>
                        <a
                          onClick={() => setTiketFilter(sub.v)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                            fontSize: ".82rem", fontWeight: tiketFilter === sub.v ? 600 : 400,
                            color: tiketFilter === sub.v ? "#fff" : "rgba(255,255,255,0.6)",
                            background: tiketFilter === sub.v
                              ? "rgba(255,255,255,0.15)"
                              : "transparent",
                            borderLeft: tiketFilter === sub.v
                              ? "3px solid rgba(255,255,255,0.8)"
                              : "3px solid transparent",
                            transition: "all .18s",
                          }}
                        >
                          <i className={`fas ${sub.ic}`} style={{ width: 14, textAlign: "center", fontSize: ".78rem" }} />
                          <span style={{ flex: 1 }}>{sub.l}</span>
                          <span style={{
                            background: tiketFilter === sub.v ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                            borderRadius: 10, padding: "1px 7px", fontSize: ".72rem",
                            fontWeight: 700, minWidth: 20, textAlign: "center",
                          }}>
                            {sub.count}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Sub-menu filter Laporan */}
                {t.k === "laporan" && tab === "laporan" && (
                  <ul style={{ listStyle: "none", margin: "2px 0 4px", padding: "0 0 0 12px" }}>
                    {([
                      { v: "teknisi", ic: "fa-tools", l: "Teknisi", count: laporan.length },
                      { v: "sales",   ic: "fa-map-marked-alt", l: "Survey Sales", count: surveyLaporan.length },
                    ] as const).map((sub) => (
                      <li key={sub.v}>
                        <a
                          onClick={() => setLapFilter(sub.v)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                            fontSize: ".82rem", fontWeight: lapFilter === sub.v ? 600 : 400,
                            color: lapFilter === sub.v ? "#fff" : "rgba(255,255,255,0.6)",
                            background: lapFilter === sub.v
                              ? "rgba(255,255,255,0.15)"
                              : "transparent",
                            borderLeft: lapFilter === sub.v
                              ? "3px solid rgba(255,255,255,0.8)"
                              : "3px solid transparent",
                            transition: "all .18s",
                          }}
                        >
                          <i className={`fas ${sub.ic}`} style={{ width: 14, textAlign: "center", fontSize: ".78rem" }} />
                          <span style={{ flex: 1 }}>{sub.l}</span>
                          <span style={{
                            background: lapFilter === sub.v ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                            borderRadius: 10, padding: "1px 7px", fontSize: ".72rem",
                            fontWeight: 700, minWidth: 20, textAlign: "center",
                          }}>
                            {sub.count}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>
        <main className="dash-content">
          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <>
              <h2>Selamat Datang, {currentUser?.name}!</h2>
              <p className="subtitle">Ringkasan aktivitas sistem hari ini</p>
              <div className="dash-stats">
                <Stat ic="b1" icon="fa-box" v={stats.paket} l="Total Paket" />
                <Stat ic="b2" icon="fa-ticket-alt" v={stats.tiket} l="Tiket Aktif" />
                <Stat ic="b3" icon="fa-user-plus" v={stats.calon} l="Calon Baru" />
                <Stat ic="b4" icon="fa-comment-dots" v={stats.keluhan} l="Keluhan Aktif" />
                <Stat ic="b5" icon="fa-file-alt" v={stats.laporan} l="Total Laporan" />
              </div>
              <div className="dash-card">
                <div className="dash-card-head"><h3>Tiket Terbaru</h3></div>
                <div className="table-wrap">
                  <table className="th-table">
                    <thead><tr><th>ID</th><th>Pelanggan</th><th>HP</th><th>Jenis</th><th>Status</th><th>Tanggal</th></tr></thead>
                    <tbody>
                      {tickets.slice(0, 5).map((t) => (
                        <tr key={t.id}><td>{t.id}</td><td>{t.pel}</td><td>{t.hp}</td><td>{t.jenis}</td>
                          <td><span className={`th-badge ${stBadge(t.st)}`}>{t.st}</span></td><td>{t.tgl}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── PAKET ── */}
          {tab === "paket" && (
            <>
              <h2>Manajemen Paket</h2>
              <p className="subtitle">Tambah, edit, atau hapus paket layanan</p>
              <div className="dash-card">
                <div className="dash-card-head">
                  <h3>Daftar Paket</h3>
                  <button className="th-btn th-btn-primary th-btn-sm"
                    onClick={() => setPaketModal({ open: true, editing: null })}>
                    <i className="fas fa-plus" /> Tambah Paket
                  </button>
                </div>
                <div className="table-wrap">
                  <table className="th-table">
                    <thead><tr><th>Nama</th><th>Kategori</th><th>Speed</th><th>Harga</th><th>Aksi</th></tr></thead>
                    <tbody>
                      {paketList.map((p) => (
                        <tr key={p.id}>
                          <td><strong>{p.nama}</strong><br /><small style={{ color: "var(--th-muted)" }}>{p.desc}</small></td>
                          <td><span className="th-badge badge-info">{p.kat}</span></td>
                          <td>{p.speed} Mbps</td>
                          <td>{fmtRp(p.harga)}</td>
                          <td>
                            <button className="act-btn edit" onClick={() => setPaketModal({ open: true, editing: p })}>
                              <i className="fas fa-edit" /> Edit
                            </button>
                            <button className="act-btn del" onClick={() => deletePaket(p.id)}>
                              <i className="fas fa-trash" /> Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── TIKET ── */}
          {tab === "tiket" && (
            <>
              <h2>{tiketFilter === "teknisi" ? "Penugasan Teknisi" : "Survey Pelanggan"}</h2>
              <p className="subtitle">
                {tiketFilter === "teknisi"
                  ? "Kelola tiket pemasangan, pemeliharaan, dan pencabutan"
                  : "Kelola tiket survey yang ditugaskan ke sales"}
              </p>

              {/* ── Filter Bulan & Tahun ── */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 12, marginBottom: 12,
                padding: "10px 14px", borderRadius: 10,
                background: "var(--th-surface,#fff)", border: "1px solid var(--th-border,#dee2e6)",
              }}>
                <FilterDate
                  bulan={tiketBulan}
                  tahun={tiketTahun}
                  onChange={(_, b, t) => { setTiketBulan(b); setTiketTahun(t); }}
                />
                <span style={{ fontSize: ".8rem", color: "var(--th-muted,#6c757d)" }}>
                  Menampilkan{" "}
                  <strong>{tiketFilter === "teknisi" ? tiketTeknisiFiltered.length : tiketSalesFiltered.length}</strong>
                  {" "}dari{" "}
                  <strong>{tiketFilter === "teknisi" ? tickets.filter(t => t.jenis !== "survey").length : tickets.filter(t => t.jenis === "survey").length}</strong>
                  {" "}Penugasan
                </span>
              </div>


              {/* ── Tiket Teknisi ── */}
              {tiketFilter === "teknisi" && (
                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3>Daftar Penugasan Teknisi</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="th-btn th-btn-accent th-btn-sm" onClick={exportTiket}>
                        <i className="fas fa-file-excel" /> Export Excel
                      </button>
                      <button className="th-btn th-btn-primary th-btn-sm"
                        onClick={() => setTicketModal({ open: true, from: null, isSales: false })}>
                        <i className="fas fa-plus" /> Buat Tiket
                      </button>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="th-table">
                      <thead><tr><th>ID</th><th>Pelanggan</th><th>HP</th><th>Jenis</th><th>Prioritas</th><th>Teknisi</th><th>Estimasi</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {tiketTeknisiFiltered.length === 0 ? (
                          <tr><td colSpan={10}><div className="empty-state"><i className="fas fa-tools" /><p>Tidak ada tiket teknisi{tiketBulan || tiketTahun ? " pada periode ini" : ""}</p></div></td></tr>
                        ) : tiketTeknisiFiltered.map((t) => (
                          <tr key={t.id}><td>{t.id}</td><td>{t.pel}</td><td>{t.hp}</td>
                            <td><span className="th-badge badge-info">{t.jenis}</span></td>
                            <td><span className={`th-badge ${t.pri === "Tinggi" ? "badge-danger" : t.pri === "Sedang" ? "badge-warning" : "badge-info"}`}>{t.pri}</span></td>
                            <td>{t.tek}</td>
                            <td>
                              {t.estimasiMulai && t.estimasiSelesai ? (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  padding: "2px 8px", borderRadius: 12, fontSize: ".8rem", fontWeight: 600,
                                  background: "rgba(108,99,255,0.1)", color: "#6c63ff",
                                }}>
                                  <i className="fas fa-clock" style={{ fontSize: ".72rem" }} /> {t.estimasiMulai} — {t.estimasiSelesai}
                                </span>
                              ) : (
                                <span style={{ color: "var(--th-muted,#adb5bd)", fontSize: ".82rem" }}>-</span>
                              )}
                            </td>
                            <td><span className={`th-badge ${stBadge(t.st)}`}>{t.st}</span></td>
                            <td style={{ fontSize: ".82rem", color: "var(--th-muted,#6c757d)" }}>{t.tgl}</td>
                            <td><button className="act-btn del" onClick={() => deleteTicket(t.id)}><i className="fas fa-trash" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Tiket Sales (Survey) ── */}
              {tiketFilter === "sales" && (
                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3>Daftar Tiket Survey (Sales)</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="th-btn th-btn-accent th-btn-sm" onClick={exportTiket}>
                        <i className="fas fa-file-excel" /> Export Excel
                      </button>
                      <button className="th-btn th-btn-primary th-btn-sm"
                        onClick={() => setTicketModal({ open: true, from: null, isSales: true })}>
                        <i className="fas fa-plus" /> Buat Tiket Sales
                      </button>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="th-table">
                      <thead><tr><th>ID</th><th>Pelanggan</th><th>HP</th><th>Alamat</th><th>Prioritas</th><th>Sales</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {tiketSalesFiltered.length === 0 ? (
                          <tr><td colSpan={9}><div className="empty-state"><i className="fas fa-map-marked-alt" /><p>Tidak ada tiket survey{tiketBulan || tiketTahun ? " pada periode ini" : ""}</p></div></td></tr>
                        ) : tiketSalesFiltered.map((t) => (
                          <tr key={t.id}><td>{t.id}</td><td>{t.pel}</td><td>{t.hp}</td>
                            <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.alm}</td>
                            <td><span className={`th-badge ${t.pri === "Tinggi" ? "badge-danger" : t.pri === "Sedang" ? "badge-warning" : "badge-info"}`}>{t.pri}</span></td>
                            <td>{t.tek}</td>
                            <td><span className={`th-badge ${stBadge(t.st)}`}>{t.st}</span></td>
                            <td style={{ fontSize: ".82rem", color: "var(--th-muted,#6c757d)" }}>{t.tgl}</td>
                            <td><button className="act-btn del" onClick={() => deleteTicket(t.id)}><i className="fas fa-trash" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── CALON PELANGGAN ── */}
          {tab === "calon" && (
            <>
              <h2>Calon Pelanggan</h2>
              <p className="subtitle">Pendaftar baru yang menunggu diproses</p>
              <div className="dash-card">
                <div className="dash-card-head">
                  <h3>Daftar Calon</h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <FilterDate
                      bulan={calonBulan}
                      tahun={calonTahun}
                      onChange={(_, b, t) => { setCalonBulan(b); setCalonTahun(t); }}
                    />
                    <button className="th-btn th-btn-accent th-btn-sm" onClick={exportCalon}>
                      <i className="fas fa-file-excel" /> Export Excel
                    </button>
                  </div>
                </div>
                {(calonBulan || calonTahun) && (
                  <div style={{
                    padding: "6px 16px", fontSize: ".8rem",
                    color: "var(--th-muted,#6c757d)",
                    borderBottom: "1px solid var(--th-border,#dee2e6)",
                  }}>
                    Menampilkan <strong>{calonFiltered.length}</strong> dari <strong>{calon.length}</strong> calon pelanggan
                  </div>
                )}
                <div className="table-wrap">
                  <table className="th-table">
                    <thead><tr><th>Tanggal</th><th>Nama</th><th>HP</th><th>Paket</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                      {calonFiltered.length === 0 ? (
                        <tr><td colSpan={6}><div className="empty-state"><i className="fas fa-inbox" /><p>Tidak ada calon{calonBulan || calonTahun ? " pada periode ini" : ""}</p></div></td></tr>
                      ) : calonFiltered.map((c) => (
                        <tr key={c.id}><td>{c.tgl}</td><td>{c.nama}</td><td>{c.hp}</td><td>{c.paket}</td>
                          <td><span className={`th-badge ${stBadge(c.status)}`}>{c.status}</span></td>
                          <td>
                            {c.status === "baru" && (
                              <button className="act-btn upd" onClick={async () => {
                                const cl = await prosesCalon(c.id);
                                if (cl) setTicketModal({ open: true, from: cl });
                              }}><i className="fas fa-paper-plane" /> Buat Tiket</button>
                            )}
                            <button className="act-btn del" onClick={() => deleteCalon(c.id)}>
                              <i className="fas fa-trash" /> Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── KELUHAN ── */}
          {tab === "keluhan" && (
            <>
              <h2>Keluhan Pelanggan</h2>
              <p className="subtitle">Tindak lanjuti keluhan masuk</p>
              <div className="dash-card">
                <div className="table-wrap">
                  <table className="th-table">
                    <thead><tr><th>Tanggal</th><th>Nama</th><th>HP</th><th>Pesan</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                      {keluhan.map((k) => (
                        <tr key={k.id}><td>{k.tgl}</td><td>{k.nama}</td><td>{k.hp}</td><td>{k.pesan}</td>
                          <td><span className={`th-badge ${stBadge(k.status)}`}>{k.status}</span></td>
                          <td><button className="act-btn upd" onClick={() => cycleKeluhan(k.id)}>
                            <i className="fas fa-sync" /> Update
                          </button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── LAPORAN ── */}
          {tab === "laporan" && (
            <>
              <h2>Laporan</h2>
              <p className="subtitle">Laporan teknisi & laporan sales</p>

              {/* ── Filter Bulan & Tahun ── */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 12, marginBottom: 12,
                padding: "10px 14px", borderRadius: 10,
                background: "var(--th-surface,#fff)", border: "1px solid var(--th-border,#dee2e6)",
              }}>
                <FilterDate
                  showTanggal={true}
                  tanggal={lapTanggal}
                  bulan={lapBulan}
                  tahun={lapTahun}
                  onChange={(d, b, t) => { setLapTanggal(d); setLapBulan(b); setLapTahun(t); }}
                />
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: ".8rem", color: "var(--th-muted,#6c757d)" }}>
                    Menampilkan{" "}
                    <strong>{lapFilter === "teknisi" ? laporanFiltered.length : surveyLaporanFiltered.length}</strong>
                    {" "}dari{" "}
                    <strong>{lapFilter === "teknisi" ? laporan.length : surveyLaporan.length}</strong>
                    {" "}Laporan
                  </span>
                  <button className="th-btn th-btn-accent th-btn-sm" onClick={exportLaporan}>
                    <i className="fas fa-file-excel" /> Export Excel
                  </button>
                </div>
              </div>

              {/* ── Laporan Teknisi ── */}
              {lapFilter === "teknisi" && (
                <div className="dash-card">
                  <div className="table-wrap">
                    <table className="th-table">
                      <thead><tr><th>Tgl</th><th>Tiket</th><th>Pelanggan</th><th>Jenis</th><th>Teknisi</th><th>Rating</th><th>TTD</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {laporanFiltered.length === 0 ? (
                          <tr><td colSpan={8}><div className="empty-state"><i className="fas fa-file-alt" /><p>Belum ada laporan teknisi{lapBulan || lapTahun ? " pada periode ini" : ""}</p></div></td></tr>
                        ) : laporanFiltered.map((l) => (
                          <tr key={l.id}><td>{l.tgl}</td><td>{l.ticketId}</td><td>{l.pel}</td><td>{l.jenis}</td>
                            <td>{l.tekName}</td><td><StarsStatic n={l.rating} /></td>
                            <td>{l.ttd ? <img src={l.ttd} alt="ttd" style={{ height: 32 }} /> : "-"}</td>
                            <td>
                              <button className="act-btn upd" onClick={() => setDetailLaporan(l)}>
                                <i className="fas fa-eye" /> Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Laporan Sales ── */}
              {lapFilter === "sales" && (
                <div className="dash-card">
                  <div className="table-wrap">
                    <table className="th-table">
                      <thead><tr><th>Tgl</th><th>Tiket</th><th>Calon Pelanggan</th><th>Sinyal</th><th>Minat</th><th>Rekomendasi</th><th>Sales</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {surveyLaporanFiltered.length === 0 ? (
                          <tr><td colSpan={8}><div className="empty-state"><i className="fas fa-map-marked-alt" /><p>Belum ada laporan survey{lapBulan || lapTahun ? " pada periode ini" : ""}</p></div></td></tr>
                        ) : surveyLaporanFiltered.map((l) => (
                          <tr key={l.id}>
                            <td>{l.tgl}</td>
                            <td>{l.ticketId}</td>
                            <td><strong>{l.calon}</strong><br /><small>{l.hp}</small></td>
                            <td>
                              <span className={`th-badge ${l.sinyal === "kuat" ? "badge-success" : l.sinyal === "sedang" ? "badge-warning" : "badge-danger"}`}>
                                {l.sinyal === "kuat" ? "🟢 Kuat" : l.sinyal === "sedang" ? "🟡 Sedang" : "🔴 Lemah"}
                              </span>
                            </td>
                            <td>
                              <span className={`th-badge ${{ sangat_minat: "badge-success", minat: "badge-info", ragu: "badge-warning", tidak_minat: "badge-danger" }[l.minat] || "badge-info"}`}>
                                {{ sangat_minat: "Sangat Minat", minat: "Minat", ragu: "Ragu-ragu", tidak_minat: "Tidak Minat" }[l.minat]}
                              </span>
                            </td>
                            <td>
                              <span className={`th-badge ${{ layak: "badge-success", perlu_review: "badge-warning", tidak_layak: "badge-danger" }[l.rekomendasi] || "badge-info"}`}>
                                {{ layak: "Layak", perlu_review: "Perlu Review", tidak_layak: "Tidak Layak" }[l.rekomendasi]}
                              </span>
                            </td>
                            <td>{l.salesName}</td>
                            <td>
                              <button className="act-btn upd" onClick={() => setDetailSurveyLap(l)}>
                                <i className="fas fa-eye" /> Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── GALERI ── */}
          {tab === "galeri" && (
            <>
              <h2>Manajemen Galeri</h2>
              <p className="subtitle">Tambah atau hapus foto dokumentasi kegiatan</p>
              <div className="dash-card">
                <div className="dash-card-head">
                  <h3>{editGalId ? "Edit Judul Foto" : "Upload Foto Baru"}</h3>
                  {editGalId && (
                    <button className="th-btn th-btn-outline th-btn-sm" onClick={() => { setEditGalId(null); setGalTitle(""); }}>
                      Batal
                    </button>
                  )}
                </div>
                <div style={{ padding: 20, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div className="form-group" style={{ margin: 0, flex: "1 1 200px" }}>
                    <label>Judul Foto *</label>
                    <input className="form-control" value={galTitle} placeholder="Contoh: Pemasangan Baru"
                      onChange={(e) => setGalTitle(e.target.value)} />
                  </div>
                  {!editGalId && (
                    <div className="form-group" style={{ margin: 0, flex: "1 1 200px" }}>
                      <label>File Gambar *</label>
                      <input className="form-control" type="file" accept="image/*" ref={fileRef} />
                    </div>
                  )}
                  <button className="th-btn th-btn-primary th-btn-sm" onClick={handleGallerySubmit}
                    style={{ height: 42 }}>
                    <i className={`fas ${editGalId ? "fa-save" : "fa-upload"}`} /> {editGalId ? "Simpan" : "Upload"}
                  </button>
                </div>
              </div>
              <div className="dash-card" style={{ marginTop: 20 }}>
                <div className="dash-card-head"><h3>Daftar Foto ({gallery.length})</h3></div>
                <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
                  {gallery.map((g) => (
                    <div key={g.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", boxShadow: "var(--th-shadow-sm)", background: "#f8f9fa" }}>
                      <img src={g.img} alt={g.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                      <div style={{ padding: "8px 12px", fontSize: ".85rem", fontWeight: 600 }}>{g.title}</div>
                      <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4 }}>
                        <button className="act-btn edit"
                          style={{ background: "rgba(13,110,253,.9)", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: ".75rem", border: "none", cursor: "pointer" }}
                          onClick={() => startEditGallery(g)}>
                          <i className="fas fa-edit" />
                        </button>
                        <button className="act-btn del"
                          style={{ background: "rgba(220,53,69,.9)", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: ".75rem", border: "none", cursor: "pointer" }}
                          onClick={() => deleteGallery(g.id)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── AKUN ── */}
          {tab === "akun" && (
            <>
              <h2>Manajemen Akun</h2>
              <p className="subtitle">Buat dan kelola akun teknisi & sales</p>
              <div className="dash-card">
                <div className="dash-card-head">
                  <h3>{editAccId ? "Edit Akun" : "Buat Akun Baru"}</h3>
                  {editAccId && (
                    <button className="th-btn th-btn-outline th-btn-sm" onClick={() => { setEditAccId(null); setAccForm({ username: "", password: "", name: "", role: "teknisi" }); }}>
                      Batal
                    </button>
                  )}
                </div>
                <div style={{ padding: 20 }}>
                  <form onSubmit={handleAccountSubmit} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div className="form-group" style={{ margin: 0, flex: "1 1 140px" }}>
                      <label>Username *</label>
                      <input className="form-control" required value={accForm.username}
                        onChange={(e) => setAccForm((p) => ({ ...p, username: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: "1 1 140px" }}>
                      <label>Password *</label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <input className="form-control" required
                          type={showAccPass ? "text" : "password"}
                          value={accForm.password}
                          style={{ paddingRight: 40 }}
                          onChange={(e) => setAccForm((p) => ({ ...p, password: e.target.value }))} />
                        <button type="button"
                          onClick={() => setShowAccPass((v) => !v)}
                          style={{
                            position: "absolute", right: 10, background: "none", border: "none",
                            cursor: "pointer", color: "var(--th-muted, #6c757d)", padding: 0, fontSize: "1rem",
                            display: "flex", alignItems: "center",
                          }}>
                          <i className={`fas ${showAccPass ? "fa-eye-slash" : "fa-eye"}`} />
                        </button>
                      </div>
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: "1 1 160px" }}>
                      <label>Nama Lengkap *</label>
                      <input className="form-control" required value={accForm.name}
                        onChange={(e) => setAccForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: "1 1 120px" }}>
                      <label>Role *</label>
                      <select className="form-control" value={accForm.role}
                        onChange={(e) => setAccForm((p) => ({ ...p, role: e.target.value as Role }))}>
                        <option value="">Pilih Role</option>
                        <option value="teknisi">Teknisi</option>
                        <option value="sales">Sales</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <button type="submit" className="th-btn th-btn-primary th-btn-sm" style={{ height: 42 }}>
                      <i className={`fas ${editAccId ? "fa-save" : "fa-plus"}`} /> {editAccId ? "Simpan" : "Buat Akun"}
                    </button>
                  </form>
                </div>
              </div>
              <div className="dash-card" style={{ marginTop: 20 }}>
                <div className="dash-card-head"><h3>Daftar Akun ({accounts.length})</h3></div>
                <div className="table-wrap">
                  <table className="th-table">
                    <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Staff ID</th><th>Aksi</th></tr></thead>
                    <tbody>
                      {accounts.map((a) => (
                        <tr key={a.id}>
                          <td>{a.username}</td>
                          <td>{a.name}</td>
                          <td><span className={`th-badge ${a.role === "admin" ? "badge-danger" : a.role === "teknisi" ? "badge-info" : "badge-success"}`}>{a.role}</span></td>
                          <td>{a.staffId || "-"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="act-btn upd" onClick={() => startEditAccount(a)}>
                                <i className="fas fa-edit" /> Edit
                              </button>
                              {a.role !== "admin" && (
                                <button className="act-btn del" onClick={() => deleteAccount(a.id)}>
                                  <i className="fas fa-trash" /> Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── AKUN USER / PELANGGAN ── */}
          {tab === "akun_user" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2>Manajemen Akun User &amp; Pelanggan</h2>
                  <p className="subtitle">
                    Pantau akun pengguna, status pemasangan internet, serta kelola ID Pelanggan
                  </p>
                </div>
                <button
                  className="th-btn th-btn-outline th-btn-sm"
                  onClick={refreshCustomerUsers}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <i className="fas fa-sync-alt" /> Refresh Data
                </button>
              </div>

              {/* Stats Cards */}
              <div className="dash-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 20 }}>
                <div className="dash-stat">
                  <div className="ic b1"><i className="fas fa-users" /></div>
                  <div><h3>{userStats.total}</h3><p>Total Akun User</p></div>
                </div>
                <div className="dash-stat">
                  <div className="ic b3"><i className="fas fa-user-check" /></div>
                  <div><h3>{userStats.aktif}</h3><p>Aktif / Ber-ID Pelanggan</p></div>
                </div>
                <div className="dash-stat">
                  <div className="ic b2"><i className="fas fa-user-clock" /></div>
                  <div><h3>{userStats.belum}</h3><p>Belum Pasang Internet</p></div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="dash-card" style={{ marginBottom: 20 }}>
                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: ".85rem", fontWeight: 600, color: "#64748b" }}>Filter Status:</span>
                    <button
                      className={`th-btn th-btn-sm ${userFilterStatus === "semua" ? "th-btn-primary" : "th-btn-outline"}`}
                      onClick={() => setUserFilterStatus("semua")}
                    >
                      Semua ({userStats.total})
                    </button>
                    <button
                      className={`th-btn th-btn-sm ${userFilterStatus === "aktif" ? "th-btn-primary" : "th-btn-outline"}`}
                      onClick={() => setUserFilterStatus("aktif")}
                      style={{ color: userFilterStatus === "aktif" ? "#fff" : "#16a34a" }}
                    >
                      <i className="fas fa-check-circle" style={{ marginRight: 4 }} /> Sudah Pasang ({userStats.aktif})
                    </button>
                    <button
                      className={`th-btn th-btn-sm ${userFilterStatus === "tidak_aktif" ? "th-btn-primary" : "th-btn-outline"}`}
                      onClick={() => setUserFilterStatus("tidak_aktif")}
                      style={{ color: userFilterStatus === "tidak_aktif" ? "#fff" : "#d97706" }}
                    >
                      <i className="fas fa-clock" style={{ marginRight: 4 }} /> Belum Pasang ({userStats.belum})
                    </button>
                  </div>

                  <div style={{ position: "relative", minWidth: 260 }}>
                    <input
                      className="form-control"
                      placeholder="Cari user, nama, HP, ID..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      style={{ paddingLeft: 34, height: 38, fontSize: ".85rem" }}
                    />
                    <i
                      className="fas fa-search"
                      style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: ".85rem" }}
                    />
                    {userSearchQuery && (
                      <i
                        className="fas fa-times"
                        onClick={() => setUserSearchQuery("")}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", cursor: "pointer", fontSize: ".85rem" }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Table Data User */}
              <div className="dash-card">
                <div className="dash-card-head">
                  <h3>
                    Daftar Akun User ({filteredCustomerUsers.length})
                  </h3>
                </div>
                <div className="table-wrap">
                  {filteredCustomerUsers.length > 0 ? (
                    <table className="th-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Nama Lengkap</th>
                          <th>Kontak</th>
                          <th>Alamat</th>
                          <th>ID Pelanggan</th>
                          <th>Status Pemasangan</th>
                          <th>Tgl Daftar</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomerUsers.map((u) => {
                          const hasId = Boolean(u.idPelanggan);
                          const isUserAktif = u.status === "aktif" || hasId;
                          return (
                            <tr key={u.id}>
                              <td><strong>{u.username}</strong></td>
                              <td>{u.name}</td>
                              <td>
                                <div><i className="fas fa-phone" style={{ width: 14, color: "#64748b" }} /> {u.hp || "-"}</div>
                                {u.email && <div style={{ fontSize: ".78rem", color: "#64748b" }}><i className="fas fa-envelope" style={{ width: 14 }} /> {u.email}</div>}
                              </td>
                              <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={u.alamat}>
                                {u.alamat || "-"}
                              </td>
                              <td>
                                {hasId ? (
                                  <span
                                    className="th-badge badge-success"
                                    style={{ fontWeight: 700, letterSpacing: "0.5px", fontSize: ".82rem" }}
                                  >
                                    <i className="fas fa-id-badge" style={{ marginRight: 4 }} /> {u.idPelanggan}
                                  </span>
                                ) : (
                                  <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: ".82rem" }}>
                                    <i className="fas fa-minus-circle" style={{ marginRight: 4 }} /> Belum Ada
                                  </span>
                                )}
                              </td>
                              <td>
                                {isUserAktif ? (
                                  <span className="th-badge badge-success">
                                    <i className="fas fa-wifi" style={{ marginRight: 4 }} /> Aktif Terpasang
                                  </span>
                                ) : (
                                  <span className="th-badge badge-warning">
                                    <i className="fas fa-clock" style={{ marginRight: 4 }} /> Belum Pasang
                                  </span>
                                )}
                              </td>
                              <td>{u.createdAt || "-"}</td>
                              <td>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {!hasId ? (
                                    <button
                                      className="act-btn"
                                      onClick={() => activateUser(u.id)}
                                      style={{
                                        background: "linear-gradient(135deg, #10b981, #059669)",
                                        color: "#fff",
                                        border: "none",
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        fontSize: ".75rem",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                      title="Aktifkan pemasangan dan buat ID Pelanggan"
                                    >
                                      <i className="fas fa-check" /> Pasang &amp; Beri ID
                                    </button>
                                  ) : isUserAktif ? (
                                    <button
                                      className="act-btn"
                                      onClick={() => deactivateUser(u.id)}
                                      style={{
                                        background: "#f59e0b",
                                        color: "#fff",
                                        border: "none",
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        fontSize: ".75rem",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                      title="Nonaktifkan layanan user"
                                    >
                                      <i className="fas fa-ban" /> Nonaktifkan
                                    </button>
                                  ) : (
                                    <button
                                      className="act-btn"
                                      onClick={() => activateUser(u.id)}
                                      style={{
                                        background: "#10b981",
                                        color: "#fff",
                                        border: "none",
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        fontSize: ".75rem",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <i className="fas fa-redo" /> Aktifkan Kembali
                                    </button>
                                  )}

                                  <button
                                    className="act-btn del"
                                    onClick={() => deleteCustomerUser(u.id)}
                                    title="Hapus akun user"
                                  >
                                    <i className="fas fa-trash" /> Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      <i className="fas fa-users-slash" style={{ fontSize: "2.2rem", marginBottom: 12, display: "block", color: "#cbd5e1" }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada data akun user yang sesuai</p>
                      <small style={{ color: "#94a3b8" }}>User yang mendaftar melalui web akan otomatis muncul di sini</small>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── TITIK ODP ── */}
          {tab === "odp" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2>Manajemen Titik ODP (Optical Distribution Point)</h2>
                  <p className="subtitle">
                    Kelola persebaran ODP fiber optic, kapasitas port, serta status utilisasi jaringan
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="th-btn th-btn-outline th-btn-sm"
                    onClick={exportODP}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <i className="fas fa-file-excel" style={{ color: "#16a34a" }} /> Export Excel
                  </button>
                  <button
                    className="th-btn th-btn-primary th-btn-sm"
                    onClick={() => setOdpModal({ open: true, editing: null })}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <i className="fas fa-plus" /> Tambah Titik ODP
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="dash-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
                <div className="dash-stat">
                  <div className="ic b1"><i className="fas fa-sitemap" /></div>
                  <div><h3>{odpStats.total}</h3><p>Total Titik ODP</p></div>
                </div>
                <div className="dash-stat">
                  <div className="ic b4"><i className="fas fa-plug" /></div>
                  <div><h3>{odpStats.totalKap}</h3><p>Total Port FO</p></div>
                </div>
                <div className="dash-stat">
                  <div className="ic b2"><i className="fas fa-user-check" /></div>
                  <div>
                    <h3>{odpStats.totalTer} <small style={{ fontSize: ".75rem", color: "#64748b" }}>({Math.round((odpStats.totalTer / (odpStats.totalKap || 1)) * 100)}%)</small></h3>
                    <p>Port Terpakai</p>
                  </div>
                </div>
                <div className="dash-stat">
                  <div className="ic b3"><i className="fas fa-check-circle" /></div>
                  <div><h3>{odpStats.totalSisa}</h3><p>Port Tersedia</p></div>
                </div>
                <div className="dash-stat">
                  <div className="ic b5" style={{ background: odpStats.penuh > 0 ? "rgba(239, 68, 68, 0.15)" : undefined }}>
                    <i className="fas fa-exclamation-triangle" style={{ color: odpStats.penuh > 0 ? "#ef4444" : undefined }} />
                  </div>
                  <div><h3>{odpStats.penuh}</h3><p>ODP Penuh</p></div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="dash-card" style={{ marginBottom: 20 }}>
                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="fas fa-filter" style={{ color: "#64748b", fontSize: ".85rem" }} />
                      <span style={{ fontSize: ".85rem", fontWeight: 600, color: "#64748b" }}>Wilayah:</span>
                      <select
                        className="form-control"
                        value={odpFilterWilayah}
                        onChange={(e) => setOdpFilterWilayah(e.target.value)}
                        style={{ padding: "6px 12px", height: 36, fontSize: ".85rem", width: "auto" }}
                      >
                        <option value="semua">Semua Wilayah</option>
                        {odpWilayahOptions.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: ".85rem", fontWeight: 600, color: "#64748b" }}>Status:</span>
                      <select
                        className="form-control"
                        value={odpFilterStatus}
                        onChange={(e) => setOdpFilterStatus(e.target.value)}
                        style={{ padding: "6px 12px", height: 36, fontSize: ".85rem", width: "auto" }}
                      >
                        <option value="semua">Semua Status</option>
                        <option value="tersedia">Tersedia</option>
                        <option value="penuh">Penuh</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="rusak">Rusak</option>
                      </select>
                    </div>

                    {(odpFilterWilayah !== "semua" || odpFilterStatus !== "semua" || odpSearchQuery) && (
                      <button
                        className="th-btn th-btn-outline th-btn-sm"
                        onClick={() => {
                          setOdpFilterWilayah("semua");
                          setOdpFilterStatus("semua");
                          setOdpSearchQuery("");
                        }}
                        style={{ height: 36, fontSize: ".8rem" }}
                      >
                        <i className="fas fa-times" /> Reset
                      </button>
                    )}
                  </div>

                  <div style={{ position: "relative", minWidth: 260 }}>
                    <input
                      className="form-control"
                      placeholder="Cari kode ODP, wilayah, alamat..."
                      value={odpSearchQuery}
                      onChange={(e) => setOdpSearchQuery(e.target.value)}
                      style={{ paddingLeft: 34, height: 36, fontSize: ".85rem" }}
                    />
                    <i
                      className="fas fa-search"
                      style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: ".85rem" }}
                    />
                    {odpSearchQuery && (
                      <i
                        className="fas fa-times"
                        onClick={() => setOdpSearchQuery("")}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", cursor: "pointer", fontSize: ".85rem" }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Table Data ODP */}
              <div className="dash-card">
                <div className="dash-card-head">
                  <h3>
                    Daftar Titik ODP ({filteredODP.length})
                  </h3>
                </div>
                <div className="table-wrap">
                  {filteredODP.length > 0 ? (
                    <table className="th-table">
                      <thead>
                        <tr>
                          <th>Kode ODP</th>
                          <th>Wilayah</th>
                          <th>Alamat &amp; Posisi</th>
                          <th>GPS Koordinat</th>
                          <th style={{ minWidth: 160 }}>Kapasitas &amp; Penggunaan Port</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredODP.map((o) => {
                          const pct = Math.round((o.terpakai / (o.kapasitas || 1)) * 100);
                          const sisa = Math.max(0, o.kapasitas - o.terpakai);
                          const barColor =
                            pct >= 100 ? "#ef4444" : pct >= 75 ? "#f59e0b" : "#10b981";

                          return (
                            <tr key={o.id}>
                              <td>
                                <span
                                  className="th-badge"
                                  style={{
                                    background: "rgba(59, 130, 246, 0.12)",
                                    color: "#1d4ed8",
                                    fontWeight: 700,
                                    letterSpacing: "0.5px",
                                    fontSize: ".85rem",
                                    padding: "4px 8px",
                                  }}
                                >
                                  <i className="fas fa-network-wired" style={{ marginRight: 4 }} /> {o.kode}
                                </span>
                              </td>
                              <td>
                                <strong>{o.wilayah}</strong>
                              </td>
                              <td style={{ maxWidth: 220 }}>
                                <div style={{ fontWeight: 500 }}>{o.alamat}</div>
                                {o.keterangan && (
                                  <small style={{ color: "#64748b", display: "block", marginTop: 2 }}>
                                    <i className="fas fa-info-circle" style={{ marginRight: 3 }} /> {o.keterangan}
                                  </small>
                                )}
                              </td>
                              <td>
                                {o.koordinat ? (
                                  <a
                                    href={`https://www.google.com/maps?q=${encodeURIComponent(o.koordinat)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="th-btn th-btn-outline th-btn-sm"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      fontSize: ".75rem",
                                      padding: "3px 8px",
                                      color: "#2563eb",
                                      borderColor: "#93c5fd",
                                    }}
                                    title={`Buka ${o.koordinat} di Google Maps`}
                                  >
                                    <i className="fas fa-map-marker-alt" style={{ color: "#ef4444" }} /> Maps
                                  </a>
                                ) : (
                                  <span style={{ color: "#94a3b8", fontSize: ".8rem" }}>-</span>
                                )}
                              </td>
                              <td>
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".8rem", marginBottom: 3 }}>
                                    <span><strong>{o.terpakai}</strong> / {o.kapasitas} Port</span>
                                    <span style={{ color: barColor, fontWeight: 700 }}>{pct}%</span>
                                  </div>
                                  <div style={{ width: "100%", height: 7, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width .3s" }} />
                                  </div>
                                  <small style={{ color: sisa === 0 ? "#ef4444" : "#64748b", fontSize: ".74rem" }}>
                                    {sisa === 0 ? "Port Penuh" : `Sisa: ${sisa} port kosong`}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`th-badge ${
                                    o.status === "tersedia"
                                      ? "badge-success"
                                      : o.status === "penuh"
                                      ? "badge-danger"
                                      : o.status === "maintenance"
                                      ? "badge-warning"
                                      : "badge-danger"
                                  }`}
                                >
                                  {o.status === "tersedia"
                                    ? "Tersedia"
                                    : o.status === "penuh"
                                    ? "Penuh"
                                    : o.status === "maintenance"
                                    ? "Maintenance"
                                    : "Rusak"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    className="act-btn upd"
                                    onClick={() => setOdpModal({ open: true, editing: o })}
                                    title="Edit data Titik ODP"
                                  >
                                    <i className="fas fa-edit" /> Edit
                                  </button>
                                  <button
                                    className="act-btn del"
                                    onClick={() => deleteODP(o.id)}
                                    title="Hapus Titik ODP"
                                  >
                                    <i className="fas fa-trash" /> Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      <i className="fas fa-network-wired" style={{ fontSize: "2.2rem", marginBottom: 12, display: "block", color: "#cbd5e1" }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada data Titik ODP yang sesuai filter</p>
                      <small style={{ color: "#94a3b8" }}>Klik "Tambah Titik ODP" untuk mendaftarkan titik ODP baru</small>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <PaketModal open={paketModal.open} editing={paketModal.editing}
        onClose={() => setPaketModal({ open: false, editing: null })} />
      <TicketModal open={ticketModal.open} fromCalon={ticketModal.from}
        isSalesTicket={ticketModal.isSales}
        onClose={() => setTicketModal((prev) => ({ ...prev, open: false }))} />
      <ODPModal open={odpModal.open} editing={odpModal.editing}
        onClose={() => setOdpModal({ open: false, editing: null })} />

      {detailLaporan && (
        <div className="lightbox" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: 620, background: "#fff", padding: 24, borderRadius: 12, position: "relative" }}>
            <span className="lightbox-close" onClick={() => setDetailLaporan(null)} style={{ color: "#333", background: "#f0f0f0" }}>
              <i className="fas fa-times" />
            </span>

            {/* Header modal */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {detailLaporan.jenis === "pemasangan" ? (
                    <><i className="fas fa-file-contract" style={{ color: "#0e7490", marginRight: 8 }} />Berita Acara Instalasi</>
                  ) : (
                    <><i className="fas fa-wrench" style={{ color: "#b45309", marginRight: 8 }} />Laporan Instalasi — Pemeliharaan</>
                  )}
                </h3>
                <small style={{ color: "#999" }}>Tiket #{detailLaporan.ticketId} · {detailLaporan.tgl}</small>
              </div>
              {/* Tombol Download PDF */}
              <button
                onClick={() =>
                  detailLaporan.jenis === "pemasangan"
                    ? downloadPdfPemasangan(detailLaporan)
                    : downloadPdfPemeliharaan(detailLaporan)
                }
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: detailLaporan.jenis === "pemasangan"
                    ? "linear-gradient(135deg, #0e7490, #0891b2)"
                    : "linear-gradient(135deg, #b45309, #d97706)",
                  color: "#fff", fontWeight: 600, fontSize: ".85rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                <i className="fas fa-file-pdf" />
                Download PDF
              </button>
            </div>

            {/* Data umum */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div><small style={{ color: "#666" }}>Tiket ID:</small><div><strong>{detailLaporan.ticketId}</strong></div></div>
              <div><small style={{ color: "#666" }}>Tanggal:</small><div>{detailLaporan.tgl}</div></div>
              <div><small style={{ color: "#666" }}>Pelanggan:</small><div>{detailLaporan.pel}</div></div>
              <div><small style={{ color: "#666" }}>Teknisi:</small><div>{detailLaporan.tekName}</div></div>
              <div><small style={{ color: "#666" }}>Paket:</small><div>{detailLaporan.paket}</div></div>
              <div><small style={{ color: "#666" }}>ODP:</small><div>{detailLaporan.odp}</div></div>
              <div style={{ gridColumn: "1 / -1" }}><small style={{ color: "#666" }}>Titik / Lokasi:</small><div>{detailLaporan.titik}</div></div>
              <div style={{ gridColumn: "1 / -1" }}><small style={{ color: "#666" }}>Keterangan Laporan:</small><div>{detailLaporan.keterangan}</div></div>
            </div>




            {detailLaporan.jenis === "pemeliharaan" && (
              <div style={{ background: "#f8f9fa", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <small style={{ color: "#666", display: "block" }}>Saran dan Kritik Pelanggan:</small>
                  <div>{detailLaporan.saranKritik || <em style={{ color: "#999" }}>Tidak ada</em>}</div>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <small style={{ color: "#666", display: "block", marginBottom: 8 }}>Foto Pemeliharaan:</small>
                    {detailLaporan.fotoPemeliharaan && detailLaporan.fotoPemeliharaan.length > 0 ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {detailLaporan.fotoPemeliharaan.map((foto, i) => (
                          <div key={i} style={{ width: 80, height: 80, borderRadius: 6, overflow: "hidden", border: "1px solid #ddd" }}>
                            <img src={foto} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ))}
                      </div>
                    ) : <em style={{ color: "#999" }}>Tidak ada foto</em>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <small style={{ color: "#666", display: "block", marginBottom: 8 }}>File Laporan (PDF/Doc):</small>
                    {detailLaporan.filePemeliharaan && detailLaporan.filePemeliharaan.length > 0 ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {detailLaporan.filePemeliharaan.map((_, i) => (
                          <div key={i} style={{ width: 80, height: 80, borderRadius: 6, overflow: "hidden", border: "1px solid #ddd" }}>
                            <div style={{ background: "#eee", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#666" }}><i className="fas fa-file-alt" /></div>
                          </div>
                        ))}
                      </div>
                    ) : <em style={{ color: "#999" }}>Tidak ada file</em>}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: 16 }}>
              <div>
                <small style={{ color: "#666", display: "block" }}>Rating:</small>
                <StarsStatic n={detailLaporan.rating} />
              </div>
              <div>
                <small style={{ color: "#666", display: "block", textAlign: "right" }}>Tanda Tangan:</small>
                {detailLaporan.ttd && <img src={detailLaporan.ttd} alt="TTD" style={{ height: 40 }} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Laporan Survey Sales ── */}
      {detailSurveyLap && (
        <div className="lightbox" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: 640, background: "#fff", padding: 24, borderRadius: 12, position: "relative" }}>
            <span className="lightbox-close" onClick={() => setDetailSurveyLap(null)} style={{ color: "#333", background: "#f0f0f0" }}>
              <i className="fas fa-times" />
            </span>

            {/* Header modal survey */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  <i className="fas fa-map-marked-alt" style={{ color: "#1d4ed8", marginRight: 8 }} />
                  Laporan Survey — Calon Pelanggan
                </h3>
                <small style={{ color: "#999" }}>Tiket #{detailSurveyLap.ticketId} · {detailSurveyLap.tgl}</small>
              </div>
              {/* Tombol Download PDF Survey */}
              <button
                onClick={() => downloadPdfSurvey(detailSurveyLap)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                  color: "#fff", fontWeight: 600, fontSize: ".85rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                <i className="fas fa-file-pdf" />
                Download PDF
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", fontSize: ".88rem", marginBottom: 14 }}>
              <div><small style={{ color: "#666" }}>Tiket ID:</small><div><strong>{detailSurveyLap.ticketId}</strong></div></div>
              <div><small style={{ color: "#666" }}>Tanggal:</small><div>{detailSurveyLap.tgl}</div></div>
              <div><small style={{ color: "#666" }}>Calon Pelanggan:</small><div><strong>{detailSurveyLap.calon}</strong></div></div>
              <div><small style={{ color: "#666" }}>HP:</small><div>{detailSurveyLap.hp}</div></div>
              <div><small style={{ color: "#666" }}>Sales:</small><div>{detailSurveyLap.salesName}</div></div>
              <div style={{ gridColumn: "1 / -1" }}><small style={{ color: "#666" }}>Alamat:</small><div>{detailSurveyLap.alamat}</div></div>
            </div>
            <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 14, marginBottom: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: ".88rem" }}>
              <div><small style={{ color: "#666" }}>Jarak ke ODP:</small><div>{detailSurveyLap.jarakOdp}</div></div>
              <div>
                <small style={{ color: "#666" }}>Kualitas Sinyal:</small>&nbsp;
                <span className={`th-badge ${detailSurveyLap.sinyal === "kuat" ? "badge-success" : detailSurveyLap.sinyal === "sedang" ? "badge-warning" : "badge-danger"}`}>
                  {detailSurveyLap.sinyal}
                </span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}><small style={{ color: "#666" }}>Kondisi Lokasi:</small><div>{detailSurveyLap.kondisiLokasi}</div></div>
            </div>
            <div style={{ background: "#f0f7ff", borderRadius: 8, padding: 14, marginBottom: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: ".88rem" }}>
              <div>
                <small style={{ color: "#666" }}>Minat Berlangganan:</small>&nbsp;
                <span className={`th-badge ${{ sangat_minat: "badge-success", minat: "badge-info", ragu: "badge-warning", tidak_minat: "badge-danger" }[detailSurveyLap.minat] || "badge-info"}`}>
                  {{ sangat_minat: "Sangat Minat", minat: "Minat", ragu: "Ragu-ragu", tidak_minat: "Tidak Minat" }[detailSurveyLap.minat]}
                </span>
              </div>
              <div><small style={{ color: "#666" }}>Paket Diminati:</small><div>{detailSurveyLap.paketDiminati || "-"}</div></div>
              <div style={{ gridColumn: "1 / -1" }}><small style={{ color: "#666" }}>Catatan:</small><div>{detailSurveyLap.catatan}</div></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: 14, fontSize: ".88rem" }}>
              <div>
                <small style={{ color: "#666" }}>Rekomendasi:</small><br />
                <span className={`th-badge ${{ layak: "badge-success", perlu_review: "badge-warning", tidak_layak: "badge-danger" }[detailSurveyLap.rekomendasi] || "badge-info"}`}>
                  {{ layak: "Layak Dipasang", perlu_review: "Perlu Review Lanjut", tidak_layak: "Tidak Layak" }[detailSurveyLap.rekomendasi]}
                </span>
              </div>
              {detailSurveyLap.tglRencana && (
                <div style={{ textAlign: "right" }}>
                  <small style={{ color: "#666" }}>Rencana Tindak Lanjut:</small><br />
                  <strong>{detailSurveyLap.tglRencana}</strong>
                </div>
              )}
            </div>
            {detailSurveyLap.fotoLokasi && detailSurveyLap.fotoLokasi.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <small style={{ color: "#666" }}>Foto Lokasi:</small>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {detailSurveyLap.fotoLokasi.map((f, i) => (
                    <div key={i} style={{ width: 80, height: 80, borderRadius: 6, overflow: "hidden", border: "1px solid #ddd" }}>
                      <img src={f} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ ic, icon, v, l }: { ic: string; icon: string; v: number; l: string }) {
  return (
    <div className="dash-stat">
      <div className={`ic ${ic}`}><i className={`fas ${icon}`} /></div>
      <div><h3>{v}</h3><p>{l}</p></div>
    </div>
  );
}
