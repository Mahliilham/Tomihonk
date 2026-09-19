import { useEffect, useMemo, useState } from "react";
import { useFormDraft } from "@/hooks/useFormDraft";
import { Modal, ModalHeader } from "@/components/Modal";
import { useApp } from "@/context/AppContext";
import type { Calon, CustomerUser } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  fromCalon?: Calon | null;
  defaultJenis?: "pemasangan" | "pemeliharaan" | "survey" | "dismantle";
  defaultSalesId?: string; // auto-select sales saat buka dari SalesDashboard
  isSalesTicket?: boolean; // jika true → jenis dikunci "survey" & wajib ditugaskan ke sales
}

export default function TicketModal({ open, onClose, fromCalon, defaultJenis, defaultSalesId, isSalesTicket }: Props) {
  const { accounts, calon, customerUsers, tickets, createTicket, paketList } = useApp();

  // Jika isSalesTicket, paksa jenis = "survey"
  const initialJenis = isSalesTicket ? "survey" : (defaultJenis ?? "pemasangan");

  const [form, setForm] = useState({
    pel: "", hp: "", alm: "",
    jenis: initialJenis as "pemasangan" | "pemeliharaan" | "survey" | "dismantle",
    mas: "", pri: "Sedang" as "Rendah" | "Sedang" | "Tinggi", tek: defaultSalesId ?? "",
    // Field khusus survey
    tglSurvey: "",
    // Estimasi waktu pengerjaan (jam mulai & selesai)
    estimasiMulai: "",
    estimasiSelesai: "",
    paket: "",
  });

  // Daftar teknisi dan sales dari accounts
  const teknisiList = useMemo(
    () => accounts.filter((a) => a.role === "teknisi"),
    [accounts]
  );

  const salesList = useMemo(
    () => accounts.filter((a) => a.role === "sales"),
    [accounts]
  );

  // ID teknisi yang sedang punya tiket aktif (pending / proses)
  const busyTekIds = useMemo(() => {
    const activeStatuses = ["pending", "proses"];
    return new Set(
      tickets
        .filter((t) => activeStatuses.includes(t.st) && t.tek)
        .map((t) => t.tek)
    );
  }, [tickets]);

  const busyCount = busyTekIds.size;

  // Daftar calon pelanggan (semua status, untuk dropdown nama)
  const calonList = useMemo(() => calon, [calon]);

  // Daftar pelanggan terdaftar (dari akun user)
  const pelangganList = useMemo(() => customerUsers, [customerUsers]);

  // Apakah jenis saat ini adalah survey (ditugaskan ke sales)?
  const isSurvey = form.jenis === "survey";

  // Mode nama pelanggan: "dropdown" (pilih dari calon) atau "manual" (ketik bebas)
  const [pelMode, setPelMode] = useState<"dropdown" | "manual">("dropdown");

  useEffect(() => {
    if (open && fromCalon) {
      let paketAuto = fromCalon.paket;
      const matchingPaket = paketList.find(p => fromCalon.paket.toLowerCase().includes(p.nama.toLowerCase()));
      if (matchingPaket) {
        paketAuto = `${matchingPaket.nama} - Rp ${matchingPaket.harga.toLocaleString("id-ID")}`;
      }

      setForm({
        pel: fromCalon.nama, hp: fromCalon.hp, alm: fromCalon.alamat,
        jenis: isSalesTicket ? "survey" : (defaultJenis ?? "pemasangan"),
        mas: `Pemasangan baru - ${fromCalon.paket}`, pri: "Sedang",
        tek: defaultSalesId ?? "",
        tglSurvey: "",
        estimasiMulai: "",
        estimasiSelesai: "",
        paket: paketAuto,
      });
      setPelMode("manual"); // saat dari calon, langsung isi manual
    } else if (open && !fromCalon) {
      const jenis = isSalesTicket ? "survey" : (defaultJenis ?? "pemasangan");
      const masDefault: Record<string, string> = {
        pemasangan:   "Pemasangan jaringan internet baru",
        pemeliharaan: "Pemeliharaan / perbaikan jaringan",
        survey:       "Survey calon pelanggan",
        dismantle:    "Pencabutan / dismantle perangkat",
      };
      // Jika sales ticket & hanya ada 1 teknisi, otomatis pilih
      let autoSales = defaultSalesId ?? "";
      if (isSalesTicket && !autoSales && teknisiList.length === 1) {
        autoSales = teknisiList[0].staffId || teknisiList[0].username;
      }
      setForm({
        pel: "", hp: "", alm: "",
        jenis,
        mas: masDefault[jenis],
        pri: "Sedang",
        tek: autoSales,
        tglSurvey: "",
        estimasiMulai: "",
        estimasiSelesai: "",
        paket: "",
      });
      setPelMode("dropdown");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCalon, open, defaultJenis, defaultSalesId, isSalesTicket]);

  // Saat teknisiList berubah & isSalesTicket → auto-pilih jika hanya 1 teknisi & belum ada pilihan
  useEffect(() => {
    if (isSalesTicket && open && !form.tek && teknisiList.length === 1) {
      setForm((p) => ({ ...p, tek: teknisiList[0].staffId || teknisiList[0].username }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teknisiList, isSalesTicket, open]);

  // Reset pilihan tek & isi deskripsi otomatis saat jenis berubah (hanya jika bukan isSalesTicket)
  const handleJenisChange = (jenis: typeof form.jenis) => {
    if (isSalesTicket) return; // dikunci
    const masDefault: Record<typeof form.jenis, string> = {
      pemasangan:   "Pemasangan jaringan internet baru",
      pemeliharaan: "Pemeliharaan / perbaikan jaringan",
      survey:       "Survey calon pelanggan",
      dismantle:    "Pencabutan / dismantle perangkat",
    };
    setForm((p) => ({ ...p, jenis, tek: "", mas: p.mas || masDefault[jenis] }));
  };

  // Saat pilih pelanggan dari dropdown → isi HP, Alamat otomatis
  // Mendukung dua sumber: calon pelanggan & akun user terdaftar
  const handlePelangganSelect = (value: string) => {
    if (!value) {
      setForm((p) => ({ ...p, pel: "", hp: "", alm: "" }));
      return;
    }

    // Cek prefix untuk menentukan sumber data
    if (value.startsWith("user:")) {
      const userId = value.slice(5);
      const found = pelangganList.find((u) => u.id.toString() === userId);
      if (found) {
        setForm((p) => ({
          ...p,
          pel: found.name,
          hp: found.hp || "",
          alm: found.alamat || "",
        }));
        setPelMode("manual"); // switch ke manual agar field terlihat & bisa diedit
      }
    } else if (value.startsWith("calon:")) {
      const calonId = value.slice(6);
      const found = calonList.find((c) => c.id.toString() === calonId);
      if (found) {
        let paketAuto = found.paket;
        const matchingPaket = paketList.find(p => found.paket.toLowerCase().includes(p.nama.toLowerCase()));
        if (matchingPaket) {
          paketAuto = `${matchingPaket.nama} - Rp ${matchingPaket.harga.toLocaleString("id-ID")}`;
        }

        setForm((p) => ({
          ...p,
          pel: found.nama,
          hp: found.hp,
          alm: found.alamat,
          paket: paketAuto,
          mas: p.jenis === "pemasangan" && p.mas === "Pemasangan jaringan internet baru"
                 ? `Pemasangan baru - ${found.paket}`
                 : p.mas
        }));
        setPelMode("manual"); // switch ke manual agar field terlihat & bisa diedit
      }
    } else {
      setForm((p) => ({ ...p, pel: value, hp: "", alm: "" }));
    }
  };

  // ── Draft: simpan & pulihkan form jika modal ditutup tidak sengaja ──
  const draftKey = isSalesTicket ? "draft_ticket_sales" : "draft_ticket";
  const { clearDraft } = useFormDraft(draftKey, form, setForm, open);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Cegah submit jika teknisi yang dipilih sedang bertugas
    if (busyTekIds.has(form.tek)) {
      alert("Teknisi yang dipilih sedang memiliki tugas aktif. Pilih teknisi lain atau tunggu tugasnya selesai.");
      return;
    }
    createTicket(form);
    clearDraft();
    setForm({ pel: "", hp: "", alm: "", jenis: isSalesTicket ? "survey" : "pemasangan", mas: "", pri: "Sedang", tek: "", tglSurvey: "", estimasiMulai: "", estimasiSelesai: "", paket: "" });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader icon="fa-ticket-alt" title="Buat Tiket Tugas"
        subtitle="Tugaskan ke teknisi" onClose={onClose} />
      <div className="modal-body">
        <form onSubmit={submit}>

          {/* ── Nama Pelanggan: dropdown calon atau manual ── */}
          <div className="form-group">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ margin: 0 }}>Nama Pelanggan *</label>
              {!fromCalon && (
                <button
                  type="button"
                  onClick={() => {
                    setPelMode((m) => m === "dropdown" ? "manual" : "dropdown");
                    setForm((p) => ({ ...p, pel: "", hp: "", alm: "" }));
                  }}
                  style={{
                    fontSize: ".75rem", border: "none", background: "none",
                    color: "var(--th-primary, #0d6efd)", cursor: "pointer", textDecoration: "underline",
                  }}
                >
                  {pelMode === "dropdown" ? "✏️ Ketik Manual" : "📋 Pilih dari Daftar"}
                </button>
              )}
            </div>

            {pelMode === "dropdown" && !fromCalon ? (
              <select
                className="form-control"
                required
                value=""
                onChange={(e) => handlePelangganSelect(e.target.value)}
              >
                <option value="">-- Pilih Pelanggan --</option>
                {pelangganList.length > 0 && (
                  <optgroup label="📋 Pelanggan Terdaftar (Akun User)">
                    {pelangganList.map((u) => (
                      <option key={`user-${u.id}`} value={`user:${u.id}`}>
                        {u.name}{u.idPelanggan ? ` (${u.idPelanggan})` : ""} — {u.hp || "No HP belum diisi"}{u.alamat ? `, ${u.alamat}` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
                {calonList.length > 0 && (
                  <optgroup label="👤 Calon Pelanggan">
                    {calonList.map((c) => (
                      <option key={`calon-${c.id}`} value={`calon:${c.id}`}>
                        {c.nama} — {c.hp} {c.paket ? `(${c.paket})` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            ) : (
              <input
                className="form-control"
                required
                value={form.pel}
                placeholder="Nama lengkap pelanggan"
                onChange={(e) => setForm((p) => ({ ...p, pel: e.target.value }))}
              />
            )}
          </div>

          <div className="form-group">
            <label>No HP Pelanggan *</label>
            <input className="form-control" required type="tel" maxLength={20} value={form.hp}
              placeholder="08xxxxxxxxxx"
              onChange={(e) => setForm((p) => ({ ...p, hp: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Alamat *</label>
            <textarea className="form-control" required value={form.alm}
              placeholder={pelMode === "dropdown" && !fromCalon ? "Otomatis terisi saat pilih pelanggan" : ""}
              onChange={(e) => setForm((p) => ({ ...p, alm: e.target.value }))} />
          </div>

          {/* ── Jenis Tugas: dikunci "Survey" jika isSalesTicket ── */}
          <div className="form-group">
            <label>Jenis Tugas *</label>
            {isSalesTicket ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(var(--th-primary-rgb, 13,110,253), 0.08)",
                border: "1px solid rgba(var(--th-primary-rgb, 13,110,253), 0.25)",
                fontSize: ".9rem", color: "var(--th-primary, #0d6efd)", fontWeight: 600,
              }}>
                <i className="fas fa-map-marked-alt" />
                Survey (Otomatis untuk Tiket Sales)
              </div>
            ) : (
              <select className="form-control" value={form.jenis}
                onChange={(e) => handleJenisChange(e.target.value as typeof form.jenis)}>
                <option value="pemasangan">Pemasangan</option>
                <option value="pemeliharaan">Pemeliharaan / Perbaikan</option>
                <option value="survey">Survey Calon Pelanggan</option>
                <option value="dismantle">Pencabutan / Dismantle</option>
              </select>
            )}
          </div>

          {form.jenis === "pemasangan" && (
            <div className="form-group">
              <label>Paket Internet *</label>
              <select className="form-control" required value={form.paket}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((p) => ({ ...p, paket: val, mas: p.mas === "Pemasangan jaringan internet baru" || p.mas.startsWith("Pemasangan baru -") ? `Pemasangan baru - ${val}` : p.mas }));
                }}>
                <option value="">-- Pilih Paket Internet --</option>
                {paketList.map((p) => (
                  <option key={p.id} value={`${p.nama} - Rp ${p.harga.toLocaleString("id-ID")}`}>
                    {p.nama} - Rp {p.harga.toLocaleString("id-ID")}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Deskripsi *</label>
            <textarea className="form-control" required value={form.mas}
              onChange={(e) => setForm((p) => ({ ...p, mas: e.target.value }))} />
          </div>

          {/* ── Field khusus Survey Calon Pelanggan ── */}
          {isSurvey && (
            <div style={{
              background: "rgba(var(--th-primary-rgb,13,110,253),0.05)",
              border: "1px solid rgba(var(--th-primary-rgb,13,110,253),0.2)",
              borderRadius: 10, padding: "14px 16px", marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "var(--th-primary,#0d6efd)", fontWeight: 600, fontSize: ".9rem" }}>
                <i className="fas fa-clipboard-list" /> Info Survey Calon Pelanggan
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tanggal Survey *</label>
                <input className="form-control" type="date" required={isSurvey}
                  value={form.tglSurvey}
                  onChange={(e) => setForm((p) => ({ ...p, tglSurvey: e.target.value }))} />
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Prioritas *</label>
            <select className="form-control" value={form.pri}
              onChange={(e) => setForm((p) => ({ ...p, pri: e.target.value as typeof form.pri }))}>
              <option>Rendah</option><option>Sedang</option><option>Tinggi</option>
            </select>
          </div>

          {/* ── Estimasi Waktu Pengerjaan (hanya untuk teknisi, bukan survey) ── */}
          {!isSurvey && (
            <div style={{
              background: "rgba(108,99,255,0.05)",
              border: "1px solid rgba(108,99,255,0.2)",
              borderRadius: 10, padding: "14px 16px", marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "#6c63ff", fontWeight: 600, fontSize: ".9rem" }}>
                <i className="fas fa-clock" /> Estimasi Waktu Pengerjaan
                <span style={{ fontSize: ".78rem", color: "var(--th-muted,#6c757d)", fontWeight: 400 }}>(opsional)</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label>Jam Mulai</label>
                  <input className="form-control" type="time" value={form.estimasiMulai}
                    onChange={(e) => setForm((p) => ({ ...p, estimasiMulai: e.target.value }))} />
                </div>
                <div style={{ padding: "8px 0", fontSize: "1.1rem", color: "var(--th-muted,#6c757d)" }}>—</div>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label>Jam Selesai</label>
                  <input className="form-control" type="time" value={form.estimasiSelesai}
                    onChange={(e) => setForm((p) => ({ ...p, estimasiSelesai: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* ── Tugaskan ke: Teknisi untuk semua jenis tugas termasuk survey ── */}
          <div className="form-group">
            {false ? (
              <></>
            ) : (
              <>
                <label>
                  Tugaskan ke Teknisi *{" "}
                  <span style={{ fontSize: ".8rem", color: "var(--th-muted,#6c757d)", fontWeight: 400 }}>
                    ({form.jenis === "pemasangan" ? "Pemasangan" : form.jenis === "pemeliharaan" ? "Pemeliharaan" : form.jenis === "survey" ? "Survey Calon Pelanggan" : "Pencabutan"} → Teknisi)
                  </span>
                </label>
                <select className="form-control" required value={form.tek}
                  onChange={(e) => setForm((p) => ({ ...p, tek: e.target.value }))}>
                  <option value="">-- Pilih Teknisi --</option>
                  {teknisiList.map((t) => {
                    const tekId = t.staffId || t.username;
                    const isBusy = busyTekIds.has(tekId);
                    return (
                      <option key={t.id} value={tekId} disabled={isBusy}>
                        {isBusy ? "🔴" : "🟢"} {t.name}{t.staffId ? ` (${t.staffId})` : ""}{isBusy ? " — Sedang Bertugas" : ""}
                      </option>
                    );
                  })}
                </select>
                {busyCount > 0 && (
                  <small style={{ color: "var(--th-muted, #6c757d)", fontSize: ".78rem", marginTop: 4, display: "block" }}>
                    <i className="fas fa-info-circle" style={{ marginRight: 4, color: "#e67e22" }} />
                    {busyCount} teknisi sedang bertugas dan tidak dapat dipilih.
                  </small>
                )}
              </>
            )}
          </div>

          <button type="submit" className="th-btn th-btn-primary" style={{ width: "100%" }}>
            <i className="fas fa-paper-plane" /> Kirim Tiket
          </button>
        </form>
      </div>
    </Modal>
  );
}
