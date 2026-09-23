import { createContext, useCallback, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";

const confirmDelete = async (text: string) => {
  const result = await Swal.fire({
    title: "Konfirmasi Hapus",
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });
  return result.isConfirmed;
};
import type { Account, Calon, CurrentUser, CustomerUser, Customer, GalleryItem, Keluhan, Laporan, Notif, NotifTarget, Paket, Role, SalesVisit, SurveyLaporan, Tagihan, Ticket, TitikODP } from "@/lib/types";

interface AppContextValue {
  // auth
  currentUser: CurrentUser | null;
  login: (u: string, p: string, role: Role) => Promise<boolean>;
  logout: () => void;
  // data
  customers: Customer[];
  deleteCustomer: (i: number) => void;
  paketList: Paket[];
  savePaket: (data: Omit<Paket, "id"> & { id?: number | string }) => void;
  deletePaket: (id: number | string) => void;
  tickets: Ticket[];
  refreshTickets: () => void;
  createTicket: (t: Omit<Ticket, "id" | "st" | "tgl">) => Promise<void>;
  deleteTicket: (id: string) => void;
  cycleTicketStatus: (id: string) => void;
  calon: Calon[];
  addCalon: (c: Omit<Calon, "id" | "tgl" | "status">) => void;
  prosesCalon: (id: number | string) => Promise<Calon | undefined>;
  deleteCalon: (id: number | string) => void;
  keluhan: Keluhan[];
  addKeluhan: (k: Omit<Keluhan, "id" | "tgl" | "status">) => void;
  cycleKeluhan: (id: number | string) => void;
  laporan: Laporan[];
  addLaporan: (l: Omit<Laporan, "id" | "tgl">) => Promise<Laporan | undefined>;
  deleteLaporan: (id: number | string) => void;
  // survey laporan (sales)
  surveyLaporan: SurveyLaporan[];
  addSurveyLaporan: (l: Omit<SurveyLaporan, "id" | "tgl">) => void;
  deleteSurveyLaporan: (id: number | string) => void;
  // gallery
  gallery: GalleryItem[];
  addGallery: (title: string, imgDataUrl: string) => void;
  editGallery: (id: number | string, title: string) => void;
  deleteGallery: (id: number | string) => void;
  // accounts
  accounts: Account[];
  addAccount: (a: Omit<Account, "id">) => void;
  editAccount: (id: number | string, a: Omit<Account, "id">) => void;
  deleteAccount: (id: number | string) => void;
  // sales visits
  salesVisits: SalesVisit[];
  createSalesVisit: (v: Omit<SalesVisit, "id" | "st" | "hasil" | "tgl">) => string;
  cycleSalesVisitStatus: (id: string) => void;
  updateSalesVisitHasil: (id: string, hasil: SalesVisit["hasil"]) => void;
  deleteSalesVisit: (id: string) => void;
  // tagihan
  tagihanList: Tagihan[];
  addTagihan: (t: Omit<Tagihan, "id" | "noTagihan">) => Promise<Tagihan | undefined>;
  updateTagihan: (id: number | string, t: Partial<Tagihan>) => Promise<void>;
  deleteTagihan: (id: number | string) => Promise<void>;
  tandaiLunas: (id: number | string) => Promise<void>;
  markTagihanOverdue: () => void;
  // notif
  notifications: Record<NotifTarget, Notif[]>;
  pushNotif: (target: NotifTarget, title: string, desc: string) => void;
  markRead: (target: NotifTarget, id: string) => void;
  markAllRead: (target: NotifTarget) => void;
  // konversi calon → tiket
  konversiCalonToTicket: (calonId: number | string) => Promise<string | null>;
  // feedback link
  kirimFeedbackLink: (laporanId: number | string, pelangganHp: string) => Promise<string | undefined>;
  // customer users (akun user/pelanggan)
  customerUsers: CustomerUser[];
  registerUser: (data: Omit<CustomerUser, "id" | "idPelanggan" | "status" | "createdAt"> & { password: string }) => Promise<boolean>;
  activateUser: (id: number | string) => Promise<void>;
  deactivateUser: (id: number | string) => Promise<void>;
  deleteCustomerUser: (id: number | string) => Promise<void>;
  refreshCustomerUsers: () => void;
  // titik ODP
  odpList: TitikODP[];
  saveODP: (data: Omit<TitikODP, "id"> & { id?: number | string }) => Promise<void>;
  deleteODP: (id: number | string) => Promise<void>;
  refreshODP: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = sessionStorage.getItem("currentUser");
      return saved ? (JSON.parse(saved) as CurrentUser) : null;
    } catch {
      return null;
    }
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paketList, setPaketList] = useState<Paket[]>([]);

  // Fetch initial data from backend
  useEffect(() => {
    fetch("/api/paket")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPaketList(data);
      })
      .catch(err => console.error("Failed to fetch paket:", err));
  }, []);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Fetch tickets from backend
  const fetchTickets = useCallback(() => {
    fetch("/api/tickets")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTickets(data);
      })
      .catch(err => console.error("Failed to fetch tickets:", err));
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);
  const refreshTickets = fetchTickets;
  const [calon, setCalon] = useState<Calon[]>([]);

  // Fetch calon pelanggan dari backend
  useEffect(() => {
    fetch("/api/calon")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCalon(data);
      })
      .catch(err => console.error("Failed to fetch calon:", err));
  }, []);
  const [keluhan, setKeluhan] = useState<Keluhan[]>([]);

  // Fetch keluhan dari backend
  useEffect(() => {
    fetch("/api/keluhan")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setKeluhan(data);
      })
      .catch(err => console.error("Failed to fetch keluhan:", err));
  }, []);
  const [laporan, setLaporan] = useState<Laporan[]>([]);

  // Fetch laporan dari backend
  useEffect(() => {
    fetch("/api/laporan")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLaporan(data);
      })
      .catch(err => console.error("Failed to fetch laporan:", err));
  }, []);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // Fetch galeri dari backend
  useEffect(() => {
    fetch("/api/galeri")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGallery(data);
      })
      .catch(err => console.error("Failed to fetch galeri:", err));
  }, []);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [surveyLaporan, setSurveyLaporan] = useState<SurveyLaporan[]>([]);

  // Fetch surveyLaporan dari backend
  useEffect(() => {
    fetch("/api/survey-laporan")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSurveyLaporan(data);
      })
      .catch(err => console.error("Failed to fetch survey laporan:", err));
  }, []);

  // Fetch accounts dari backend
  useEffect(() => {
    fetch("/api/auth/users")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAccounts(data);
      })
      .catch(err => console.error("Failed to fetch accounts:", err));
  }, []);
  const [tagihanList, setTagihanList] = useState<Tagihan[]>([]);

  // Fetch tagihan dari backend
  useEffect(() => {
    fetch("/api/tagihan")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTagihanList(data);
      })
      .catch(err => console.error("Failed to fetch tagihan:", err));
  }, []);

  const [customerUsers, setCustomerUsers] = useState<CustomerUser[]>([]);

  // Fetch customer users dari backend
  const fetchCustomerUsers = useCallback(() => {
    fetch("/api/user/all")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomerUsers(data);
      })
      .catch(err => console.error("Failed to fetch customer users:", err));
  }, []);

  useEffect(() => {
    fetchCustomerUsers();
  }, [fetchCustomerUsers]);

  const [odpList, setOdpList] = useState<TitikODP[]>([]);

  // Fetch ODP dari backend
  const fetchODP = useCallback(() => {
    fetch("/api/odp")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOdpList(data);
      })
      .catch(err => console.error("Failed to fetch ODP:", err));
  }, []);

  useEffect(() => {
    fetchODP();
  }, [fetchODP]);
  const [salesVisits, setSalesVisits] = useState<SalesVisit[]>([
    { id: "SV-1001", calon: "Andi Wijaya", hp: "081200001111", alamat: "Jl. Raya Bogor No.15", tujuan: "Penawaran paket Home", catatan: "", st: "dijadwalkan", hasil: "", sales: "dewi", salesName: "Dewi Anggraini", tgl: "2025-04-22" },
    { id: "SV-1002", calon: "Sari Melati", hp: "082333445566", alamat: "Jl. Sudirman No.8", tujuan: "Follow up registrasi", catatan: "Sudah tanya via WA", st: "dikunjungi", hasil: "tertarik", sales: "dewi", salesName: "Dewi Anggraini", tgl: "2025-04-21" },
  ]);
  const [notifications, setNotifications] = useState<Record<NotifTarget, Notif[]>>({
    admin: [],
    tech: [],
    sales: [],
  });

  // ── Fetch notifikasi dari backend untuk satu target ──
  const fetchNotifications = useCallback(async (target: NotifTarget) => {
    try {
      const res = await fetch(`/api/notifications?target=${target}`);
      if (!res.ok) return;
      const data: Notif[] = await res.json();
      setNotifications((prev) => ({ ...prev, [target]: data }));
    } catch {
      // silent — tidak ganggu UX jika gagal
    }
  }, []);

  // ── Fetch semua target saat pertama load ──
  useEffect(() => {
    fetchNotifications("admin");
    fetchNotifications("tech");
    fetchNotifications("sales");
  }, [fetchNotifications]);

  // ── Polling setiap 30 detik agar notif selalu up-to-date ──
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications("admin");
      fetchNotifications("tech");
      fetchNotifications("sales");
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const pushNotif = useCallback(async (target: NotifTarget, title: string, desc: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, title, desc }),
      });
      if (!res.ok) return;
      const result = await res.json();
      const newNotif: Notif = result.data;
      setNotifications((prev) => ({
        ...prev,
        [target]: [newNotif, ...prev[target]],
      }));
    } catch {
      // silent
    }
  }, []);

  const markRead = useCallback(async (target: NotifTarget, id: string) => {
    // Optimistic update
    setNotifications((prev) => ({
      ...prev,
      [target]: prev[target].map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
    } catch {
      // silent
    }
  }, []);

  const markAllRead = useCallback(async (target: NotifTarget) => {
    // Optimistic update
    setNotifications((prev) => ({
      ...prev,
      [target]: prev[target].map((n) => ({ ...n, read: true })),
    }));
    try {
      await fetch(`/api/notifications/read-all?target=${target}`, { method: "PUT" });
    } catch {
      // silent
    }
  }, []);

  const login = useCallback(async (u: string, p: string, role: Role): Promise<boolean> => {
    try {
      // Endpoint berbeda untuk user/pelanggan
      const endpoint = role === "user" ? "/api/user/login" : "/api/auth/login";
      const body = role === "user"
        ? { username: u, password: p }
        : { username: u, password: p, role };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error("Login Gagal", { description: result.error || "Username atau password salah!" });
        return false;
      }
      const acc = result.user;
      const user: CurrentUser = role === "user"
        ? { role: "user", name: acc.name, id: acc.idPelanggan || acc.username }
        : { role, name: acc.name, id: acc.staffId || acc.username };
      setCurrentUser(user);
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      toast.success("Login Berhasil", { description: `Selamat datang, ${acc.name}!` });
      return true;
    } catch {
      toast.error("Login Gagal", { description: "Tidak dapat terhubung ke server" });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem("currentUser");
    // Hapus juga tab state agar fresh saat login berikutnya
    // localStorage.removeItem("admin_tab");
    // localStorage.removeItem("admin_lapFilter");
    // localStorage.removeItem("admin_tiketFilter");
    // localStorage.removeItem("teknisi_tab");
    // localStorage.removeItem("sales_tab");
    toast.success("Logout", { description: "Anda berhasil keluar dari sistem" });
  }, []);

  const deleteCustomer = useCallback(async (i: number) => {
    if (!(await confirmDelete("Hapus data pelanggan ini?"))) return;
    setCustomers((prev) => prev.filter((_, idx) => idx !== i));
    toast.success("Terhapus", { description: "Data pelanggan dihapus" });
  }, []);

  const savePaket = useCallback(async (data: Omit<Paket, "id"> & { id?: number | string }) => {
    try {
      if (data.id) {
        const res = await fetch(`/api/paket/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Gagal update paket");
        setPaketList((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
        toast.success("Tersimpan", { description: "Paket berhasil diperbarui di database!" });
      } else {
        const res = await fetch("/api/paket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Gagal menambah paket");
        setPaketList((prev) => [...prev, result.data]);
        toast.success("Berhasil", { description: "Paket berhasil ditambahkan ke database!" });
      }
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const deletePaket = useCallback(async (id: number | string) => {
    if (!(await confirmDelete("Hapus paket ini dari database?"))) return;
    try {
      const res = await fetch(`/api/paket/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus paket");
      setPaketList((prev) => prev.filter((p) => p.id !== id));
      toast.success("Terhapus", { description: "Paket berhasil dihapus" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  // ── Titik ODP CRUD ──
  const saveODP = useCallback(async (data: Omit<TitikODP, "id"> & { id?: number | string }) => {
    try {
      if (data.id) {
        const res = await fetch(`/api/odp/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Gagal memperbarui titik ODP");
        setOdpList((prev) => prev.map((o) => (o.id === data.id ? { ...o, ...data } : o)));
        toast.success("Tersimpan", { description: `Titik ODP ${data.kode} berhasil diperbarui` });
      } else {
        const res = await fetch("/api/odp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Gagal menambahkan titik ODP");
        setOdpList((prev) => [...prev, result.data]);
        toast.success("Berhasil", { description: `Titik ODP ${data.kode} berhasil ditambahkan` });
      }
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const deleteODP = useCallback(async (id: number | string) => {
    if (!(await confirmDelete("Hapus titik ODP ini dari database?"))) return;
    try {
      const res = await fetch(`/api/odp/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus titik ODP");
      setOdpList((prev) => prev.filter((o) => o.id !== id));
      toast.success("Terhapus", { description: "Titik ODP berhasil dihapus" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const createTicket: AppContextValue["createTicket"] = useCallback(async (t) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat tiket");
      const newTicket: Ticket = { ...t, id: result.data.id, st: "pending", tgl: result.data.tgl, estimasiMulai: t.estimasiMulai || "", estimasiSelesai: t.estimasiSelesai || "" };
      setTickets((prev) => [newTicket, ...prev]);
      if (t.jenis === "survey") {
        // Tiket survey teknisi â†’ notif ke teknisi
        pushNotif("tech", `Tiket Survey Baru: ${result.data.id}`, `${t.pel} - ${t.alm}`);
      } else {
        // Tiket lain â†’ notif ke teknisi
        pushNotif("tech", `Tiket Baru: ${result.data.id}`, `${t.pel} - ${t.jenis}`);
      }
      pushNotif("admin", `Tiket Terkirim`, `Tiket ${result.data.id} berhasil dibuat`);
      toast.success("Tiket Terkirim", { description: `Tiket berhasil disimpan ke database` });

      return result.data.id;
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
      return "";
    }
  }, [pushNotif]);

  const deleteTicket = useCallback(async (id: string) => {
    if (!(await confirmDelete("Hapus tiket dari database?"))) return;
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus tiket");
      setTickets((prev) => prev.filter((t) => t.id !== id));
      toast.success("Terhapus", { description: "Tiket berhasil dihapus" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const cycleTicketStatus = useCallback(async (id: string) => {
    const order: Ticket["st"][] = ["pending", "proses", "selesai"];
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;
    const next = order[(order.indexOf(ticket.st) + 1) % 3];
    try {
      const res = await fetch(`/api/tickets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ st: next })
      });
      if (!res.ok) throw new Error("Gagal update status");
      setTickets((prev) =>
        prev.map((t) => t.id === id ? { ...t, st: next } : t)
      );
      toast.success("Status Diperbarui", { description: `Tiket â†’ ${next.toUpperCase()}` });
      if (next === "selesai") pushNotif("admin", `Tiket Selesai: ${id}`, `Tugas diselesaikan`);
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, [pushNotif, tickets]);

  const addCalon: AppContextValue["addCalon"] = useCallback(async (c) => {
    try {
      const res = await fetch("/api/calon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan pendaftaran");
      const newCalon: Calon = result.data;
      setCalon((prev) => [newCalon, ...prev]);
      pushNotif("admin", "Calon Pelanggan Baru", `${c.nama} mendaftar ${c.paket}`);
      toast.success("Pendaftaran Terkirim", { description: "Tim kami akan segera menghubungi Anda" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, [pushNotif]);

  const prosesCalon = useCallback(async (id: number | string) => {
    try {
      const res = await fetch(`/api/calon/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "diproses" }),
      });
      if (!res.ok) throw new Error("Gagal update status calon");
      let result: Calon | undefined;
      setCalon((prev) => prev.map((c) => {
        if (c.id !== id) return c;
        result = c;
        return { ...c, status: "diproses" };
      }));
      return result;
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
      return undefined;
    }
  }, []);

  const deleteCalon = useCallback(async (id: number | string) => {
    if (!(await confirmDelete("Hapus data calon pelanggan ini?"))) return;
    try {
      const res = await fetch(`/api/calon/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data calon");
      setCalon((prev) => prev.filter((c) => c.id !== id));
      toast.success("Terhapus", { description: "Data calon pelanggan berhasil dihapus" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const addKeluhan: AppContextValue["addKeluhan"] = useCallback(async (k) => {
    try {
      const res = await fetch("/api/keluhan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(k),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan keluhan");
      const newK: Keluhan = result.data;
      setKeluhan((prev) => [newK, ...prev]);
      pushNotif("admin", "Keluhan Baru", `${k.nama}: ${k.pesan.slice(0, 40)}...`);
      toast.success("Pesan Terkirim", { description: "Terima kasih! Keluhan Anda telah tercatat." });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, [pushNotif]);

  const cycleKeluhan = useCallback(async (id: number | string) => {
    try {
      const res = await fetch(`/api/keluhan/${id}/cycle`, { method: "PUT" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal update status");
      const next = result.status as Keluhan["status"];
      setKeluhan((prev) =>
        prev.map((k) => k.id === id ? { ...k, status: next } : k)
      );
      toast.success("Status Diubah", { description: `Keluhan â†’ ${next.toUpperCase()}` });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const addLaporan: AppContextValue["addLaporan"] = useCallback(async (l) => {
    try {
      const res = await fetch("/api/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(l),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan laporan");
      const newLap: Laporan = result.data;
      setLaporan((prev) => [newLap, ...prev]);
      // Update status tiket via API agar tersimpan di database
      await fetch(`/api/tickets/${l.ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ st: "selesai" }),
      });
      setTickets((prev) => prev.map((t) => (t.id === l.ticketId ? { ...t, st: "selesai" } : t)));
      pushNotif("admin", `Laporan ${l.jenis.toUpperCase()} Masuk`, `${l.tekName} - ${l.pel}`);
      toast.success("Laporan Tersimpan", { description: "Laporan berhasil dikirim ke admin" });
      return newLap;
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
      return undefined;
    }
  }, [pushNotif]);

  const deleteLaporan = useCallback(async (id: number | string) => {
    if (!(await confirmDelete("Hapus laporan ini dari database?"))) return;
    try {
      const res = await fetch(`/api/laporan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus laporan");
      setLaporan((prev) => prev.filter((l) => l.id !== id));
      toast.success("Terhapus", { description: "Laporan berhasil dihapus" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  // Gallery
  const addGallery = useCallback(async (title: string, imgDataUrl: string) => {
    try {
      const res = await fetch("/api/galeri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, img: imgDataUrl }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan foto");
      const newItem: GalleryItem = result.data;
      setGallery((prev) => [...prev, newItem]);
      toast.success("Berhasil", { description: "Foto berhasil ditambahkan ke galeri" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const editGallery = useCallback(async (id: number | string, title: string) => {
    try {
      const res = await fetch(`/api/galeri/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Gagal memperbarui judul foto");
      }
      setGallery((prev) => prev.map((g) => g.id === id ? { ...g, title } : g));
      toast.success("Berhasil", { description: "Judul foto diperbarui" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const deleteGallery = useCallback(async (id: number | string) => {
    if (!(await confirmDelete("Hapus foto ini dari galeri?"))) return;
    try {
      const res = await fetch(`/api/galeri/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Gagal menghapus foto");
      }
      setGallery((prev) => prev.filter((g) => g.id !== id));
      toast.success("Terhapus", { description: "Foto dihapus dari galeri" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  // Accounts
  const addAccount = useCallback(async (a: Omit<Account, "id">) => {
    try {
      const response = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(a)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan ke database");
      }
      // Refresh dari backend untuk mendapatkan data lengkap termasuk staffId
      const refreshed = await fetch("/api/auth/users").then(r => r.json());
      if (Array.isArray(refreshed)) setAccounts(refreshed);
      toast.success("Berhasil", { description: `Akun ${a.role} "${a.name}" berhasil dibuat di database` });
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal", { description: error.message });
    }
  }, []);

  const editAccount = useCallback(async (id: number | string, a: Omit<Account, "id">) => {
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(a),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Gagal memperbarui akun");
      }
      // Refresh dari backend untuk mendapatkan staffId terbaru
      const refreshed = await fetch("/api/auth/users").then(r => r.json());
      if (Array.isArray(refreshed)) setAccounts(refreshed);
      toast.success("Berhasil", { description: `Akun "${a.name}" berhasil diperbarui` });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const deleteAccount = useCallback(async (id: number | string) => {
    if (!(await confirmDelete("Hapus akun ini dari database?"))) return;
    try {
      const res = await fetch(`/api/auth/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus akun");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Terhapus", { description: "Akun berhasil dihapus dari database" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  // Sales Visits
  const svSeqRef = useMemoSeq(1003);
  const createSalesVisit: AppContextValue["createSalesVisit"] = useCallback((v) => {
    const id = "SV-" + svSeqRef.next();
    const newVisit: SalesVisit = { ...v, id, st: "dijadwalkan", hasil: "", tgl: new Date().toISOString().slice(0, 10) };
    setSalesVisits((prev) => [newVisit, ...prev]);
    pushNotif("admin", `Kunjungan Sales: ${id}`, `${v.salesName} â†’ ${v.calon}`);
    pushNotif("sales", `Jadwal Baru: ${id}`, `Kunjungi ${v.calon} di ${v.alamat}`);
    toast.success("Kunjungan Dijadwalkan", { description: `${id} untuk ${v.calon}` });
    return id;
  }, [pushNotif, svSeqRef]);

  const cycleSalesVisitStatus = useCallback((id: string) => {
    const order: SalesVisit["st"][] = ["dijadwalkan", "dikunjungi", "selesai"];
    setSalesVisits((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const next = order[(order.indexOf(v.st) + 1) % 3];
        toast.success("Status Diperbarui", { description: `${v.id} â†’ ${next.toUpperCase()}` });
        if (next === "selesai") pushNotif("admin", `Kunjungan Selesai: ${v.id}`, `${v.salesName} - ${v.calon}`);
        return { ...v, st: next };
      })
    );
  }, [pushNotif]);

  const updateSalesVisitHasil = useCallback((id: string, hasil: SalesVisit["hasil"]) => {
    setSalesVisits((prev) =>
      prev.map((v) => v.id === id ? { ...v, hasil } : v)
    );
    toast.success("Hasil Diperbarui", { description: `Hasil kunjungan: ${hasil || "-"}` });
  }, []);

  const deleteSalesVisit = useCallback(async (id: string) => {
    if (!(await confirmDelete("Hapus kunjungan ini?"))) return;
    setSalesVisits((prev) => prev.filter((v) => v.id !== id));
    toast.success("Terhapus", { description: "Kunjungan dihapus" });
  }, []);

  // Survey Laporan
  const addSurveyLaporan = useCallback(async (l: Omit<SurveyLaporan, "id" | "tgl">) => {
    try {
      const res = await fetch("/api/survey-laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(l),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan laporan survey");
      const newLap: SurveyLaporan = result.data;
      setSurveyLaporan((prev) => [newLap, ...prev]);

      // â”€â”€ Auto-selesaikan tiket di backend & state lokal â”€â”€
      try {
        await fetch(`/api/tickets/${l.ticketId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ st: "selesai" }),
        });
      } catch {
        // Jika API gagal, tetap update state lokal
      }
      setTickets((prev) => prev.map((t) => t.id === l.ticketId ? { ...t, st: "selesai" } : t));

      // Update jadwal kunjungan terkait menjadi selesai
      if (l.visitId) {
        setSalesVisits((prev) => prev.map((v) => v.id === l.visitId ? { ...v, st: "selesai", hasil: l.minat === "sangat_minat" || l.minat === "minat" ? "tertarik" : "menolak" } : v));
      }
      pushNotif("admin", `Laporan Survey: ${l.ticketId}`, `${l.salesName} â€” ${l.calon}`);
      pushNotif("sales", `Tugas Selesai: ${l.ticketId}`, `Laporan survey ${l.calon} berhasil dikirim`);
      toast.success("Laporan Survey Terkirim", { description: `Tiket ${l.ticketId} otomatis ditandai selesai` });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, [pushNotif]);

  const deleteSurveyLaporan = useCallback(async (id: number | string) => {
    if (!(await confirmDelete("Hapus laporan survey ini?"))) return;
    try {
      const res = await fetch(`/api/survey-laporan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus laporan survey");
      setSurveyLaporan((prev) => prev.filter((l) => l.id !== id));
      toast.success("Terhapus", { description: "Laporan survey berhasil dihapus" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  // ── Konversi Calon → Tiket Pemasangan ──
  const konversiCalonToTicket = useCallback(async (calonId: number | string) => {
    const target = calon.find((c) => c.id === calonId);
    if (!target) {
      toast.error("Gagal", { description: "Calon tidak ditemukan" });
      return null;
    }
    if (target.status !== "diproses") {
      toast.warning("Calon belum diproses", { description: "Proses calon terlebih dahulu sebelum dikonversi ke tiket" });
      return null;
    }
    try {
      const tiketData = {
        pel: target.nama,
        hp: target.hp,
        alm: target.alamat,
        jenis: "pemasangan",
        mas: `Installation - ${target.paket}`,
        pri: "Sedang",
        tek: "",
        tglSurvey: "",
      };
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tiketData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat tiket");
      const newTicket: Ticket = { ...tiketData, id: result.data.id, st: "pending", tgl: result.data.tgl };
      setTickets((prev) => [newTicket, ...prev]);
      pushNotif("admin", "Tiket dari Calon", `Calon ${target.nama} dikonversi → ${newTicket.id}`);
      toast.success("Tiket Dibuat", { description: `Calon ${target.nama} berhasil dikonversi ke tiket ${newTicket.id}` });
      return newTicket.id;
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
      return null;
    }
  }, [calon, pushNotif, setTickets]);

  // ── Tagihan (Billing) ──
  const tagihanSeqRef = useMemoSeq(10001);

  const generateNoTagihan = useCallback((bulan: string, tahun: number) => {
    const ym = `${tahun}${bulan}`;
    return `TAG-${ym}-${String(tagihanSeqRef.next()).padStart(4, "0")}`;
  }, [tagihanSeqRef]);

  const addTagihan: AppContextValue["addTagihan"] = useCallback(async (t) => {
    try {
      const noTagihan = generateNoTagihan(t.bulan, t.tahun);
      const res = await fetch("/api/tagihan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...t, noTagihan }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menambah tagihan");
      const newT: Tagihan = result.data;
      setTagihanList((prev) => [newT, ...prev]);
      pushNotif("admin", "Tagihan Baru", `${newT.noTagihan} - ${newT.pelanggan} (${newT.jumlah.toLocaleString("id-ID")} Rp)`);
      toast.success("Tagihan Dibuat", { description: `${newT.noTagihan} berhasil dibuat` });
      return newT;
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
      return undefined;
    }
  }, [generateNoTagihan, pushNotif, setTagihanList]);

  const updateTagihan = useCallback(async (id: number | string, t: Partial<Tagihan>) => {
    try {
      const res = await fetch(`/api/tagihan/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
      if (!res.ok) throw new Error("Gagal update tagihan");
      setTagihanList((prev) => prev.map((tg) => tg.id === id ? { ...tg, ...t } : tg));
      toast.success("Tagihan Diperbarui", { description: "Data tagihan berhasil diperbarui" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, [setTagihanList]);

  const tandaiLunas = useCallback(async (id: number | string) => {
    const tag = tagihanList.find((tg) => tg.id === id);
    if (!tag) return;
    try {
      await updateTagihan(id, {
        status: "lunas",
        tglLunas: new Date().toISOString().slice(0, 10),
        metodeBayar: "Transfer Bank",
      });
      pushNotif("admin", "Tagihan Lunas", `${tag.noTagihan} - ${tag.pelanggan} sudah lunas`);
      toast.success("Terima Kasih", { description: `Tagihan ${tag.noTagihan} ditandai lunas` });
    } catch {
      // error handled in updateTagihan
    }
  }, [tagihanList, updateTagihan, pushNotif]);

  const deleteTagihan = useCallback(async (id: number | string) => {
    if (!(await confirmDelete("Hapus tagihan ini?"))) return;
    try {
      const res = await fetch(`/api/tagihan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus tagihan");
      setTagihanList((prev) => prev.filter((tg) => tg.id !== id));
      toast.success("Terhapus", { description: "Tagihan berhasil dihapus" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const markTagihanOverdue = useCallback(() => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentYear = now.getFullYear();
    tagihanList.forEach((tg) => {
      if (tg.status === "belum_bayar" && tg.jatuhTempo < now.toISOString().slice(0, 10)) {
        updateTagihan(tg.id, { status: "isolasi" });
      } else if (tg.status === "belum_bayar" && tg.bulan === currentMonth && tg.tahun === currentYear && tg.jatuhTempo < now.toISOString().slice(0, 10)) {
        updateTagihan(tg.id, { status: "dalam_proses" });
      }
    });
    toast.success("Cek Overdue", { description: "Status tagihan otomatis diperbarui" });
  }, [tagihanList, updateTagihan]);

  // ── Feedback Link Notification ──
  const kirimFeedbackLink = useCallback(async (laporanId: number | string, pelangganHp: string) => {
    const laporan = laporan.find((l) => l.id === laporanId);
    if (!laporan) {
      toast.error("Gagal", { description: "Laporan tidak ditemukan" });
      return;
    }
    const baseUrl = window.location.origin;
    const feedbackUrl = `${baseUrl}/penilaian?id=${laporanId}`;
    try {
      setLaporan((prev) => prev.map((l) => l.id === laporanId ? { ...l, feedbackLinkSent: true, feedbackLinkSentAt: new Date().toISOString() } : l));
      pushNotif("admin", "Link Penilaian Siap Kirim", `${laporanId} — kirim ke ${pelangganHp}`);
      toast.success("Link Siap", { description: "Salin link di bawah dan kirim ke pelanggan via WhatsApp" });
      return feedbackUrl;
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
      return undefined;
    }
  }, [laporan, pushNotif, setLaporan]);

  // ── Customer User Management ──
  const registerUser = useCallback(async (data: Omit<CustomerUser, "id" | "idPelanggan" | "status" | "createdAt"> & { password: string }): Promise<boolean> => {
    try {
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error("Registrasi Gagal", { description: result.error || "Gagal mendaftar" });
        return false;
      }
      // Refresh daftar customer users agar data hp, email, alamat langsung tersedia
      fetchCustomerUsers();
      // Kirim notifikasi ke admin bahwa ada pelanggan baru mendaftar
      pushNotif("admin", "Pelanggan Baru Mendaftar", `${data.name} mendaftar akun baru${data.hp ? ` (HP: ${data.hp})` : ""}`);
      toast.success("Registrasi Berhasil", { description: "Akun Anda berhasil dibuat! Silakan login." });
      return true;
    } catch {
      toast.error("Registrasi Gagal", { description: "Tidak dapat terhubung ke server" });
      return false;
    }
  }, [fetchCustomerUsers, pushNotif]);

  const activateUser = useCallback(async (id: number | string) => {
    try {
      const res = await fetch(`/api/user/${id}/activate`, { method: "PUT" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengaktifkan user");
      fetchCustomerUsers();
      toast.success("Berhasil", { description: `User berhasil diaktifkan dan mendapat ID Pelanggan` });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, [fetchCustomerUsers]);

  const deactivateUser = useCallback(async (id: number | string) => {
    try {
      const res = await fetch(`/api/user/${id}/deactivate`, { method: "PUT" });
      if (!res.ok) throw new Error("Gagal menonaktifkan user");
      fetchCustomerUsers();
      toast.success("Berhasil", { description: "User berhasil dinonaktifkan" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, [fetchCustomerUsers]);

  const deleteCustomerUser = useCallback(async (id: number | string) => {
    if (!(await confirmDelete("Hapus akun user ini?"))) return;
    try {
      const res = await fetch(`/api/user/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus user");
      setCustomerUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Terhapus", { description: "Akun user berhasil dihapus" });
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      currentUser, login, logout,
      customers, deleteCustomer,
      paketList, savePaket, deletePaket,
      tickets, refreshTickets, createTicket, deleteTicket, cycleTicketStatus,
      calon, addCalon, prosesCalon, deleteCalon,
      keluhan, addKeluhan, cycleKeluhan,
      laporan, addLaporan, deleteLaporan,
      surveyLaporan, addSurveyLaporan, deleteSurveyLaporan,
      gallery, addGallery, editGallery, deleteGallery,
      accounts, addAccount, editAccount, deleteAccount,
      salesVisits, createSalesVisit, cycleSalesVisitStatus, updateSalesVisitHasil, deleteSalesVisit,
      tagihanList, addTagihan, updateTagihan, deleteTagihan, tandaiLunas, markTagihanOverdue,
      notifications, pushNotif, markRead, markAllRead,
      konversiCalonToTicket, kirimFeedbackLink,
      customerUsers, registerUser, activateUser, deactivateUser, deleteCustomerUser, refreshCustomerUsers: fetchCustomerUsers,
      odpList, saveODP, deleteODP, refreshODP: fetchODP,
    }),
    [currentUser, login, logout, customers, deleteCustomer, paketList, savePaket, deletePaket, tickets, refreshTickets, createTicket, deleteTicket, cycleTicketStatus, calon, addCalon, prosesCalon, deleteCalon, keluhan, addKeluhan, cycleKeluhan, laporan, addLaporan, deleteLaporan, surveyLaporan, addSurveyLaporan, deleteSurveyLaporan, gallery, addGallery, editGallery, deleteGallery, accounts, addAccount, editAccount, deleteAccount, salesVisits, createSalesVisit, cycleSalesVisitStatus, updateSalesVisitHasil, deleteSalesVisit, tagihanList, addTagihan, updateTagihan, deleteTagihan, tandaiLunas, markTagihanOverdue, notifications, pushNotif, markRead, markAllRead, konversiCalonToTicket, kirimFeedbackLink, customerUsers, registerUser, activateUser, deactivateUser, deleteCustomerUser, fetchCustomerUsers, odpList, saveODP, deleteODP, fetchODP]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

// Helper: monotonic id sequence
function useMemoSeq(start = 1) {
  const [, force] = useState(0);
  const ref = useMemo(() => {
    let n = start;
    return {
      next: () => {
        const v = n++;
        return v;
      },
    };
  }, []);
  void force;
  return ref;
}
