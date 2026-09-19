import { useEffect, useRef, useState } from "react";
import { useFormDraft } from "@/hooks/useFormDraft";
import { Modal, ModalHeader } from "@/components/Modal";
import { useApp } from "@/context/AppContext";
import type { Ticket } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

export default function LaporanModal({ open, onClose, ticket }: Props) {
  const { addLaporan, currentUser, customers, customerUsers, calon, accounts, paketList, odpList } = useApp();
  // Canvas hanya dipakai untuk form survey
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── State form laporan reguler (pemasangan / pemeliharaan) ──
  // Catatan: rating, saranKritik, ttd DIHAPUS dari sini — diisi pelanggan via link WA
  const [form, setForm] = useState({
    paket: "", odp: "", titik: "", keterangan: "",
    fotoPemeliharaan: [] as string[], filePemeliharaan: [] as string[],
    // Field tambahan BERITA ACARA INSTALASI
    noPelanggan: "", marketing: "",
    serialONU: "", macAddress: "", panjangKabel: "", redaman: "",
    usernamePPPoE: "", passwordPPPoE: "",
    downloadSpeed: "", uploadSpeed: "", statusKoneksi: "Normal",
    fotoInstalasi: [] as string[],
  });

  // State untuk pemilihan Titik ODP & Port
  const [selectedOdpId, setSelectedOdpId] = useState<string>("");
  const [selectedPortNum, setSelectedPortNum] = useState<string>("1");
  const [isManualOdp, setIsManualOdp] = useState(false);

  // ── State form laporan survey ──
  const [surveyForm, setSurveyForm] = useState({
    namaPelanggan: "", alamat: "", noHp: "",
    tanggalSurvey: "", marketing: "", teknisiSurvey: "", paketInternet: "",
    catatan: "",
  });

  const isSurvey = ticket?.jenis === "survey";
  const salesList = accounts.filter((a) => a.role === "sales");

  // ── Reset canvas & auto-fill saat modal dibuka ──
  // Jika ada draft tersimpan untuk tiket ini, skip auto-fill agar draft tetap terjaga.
  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const c = canvasRef.current;
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    setHasSig(false);

    // Cek apakah sudah ada draft tersimpan — jika ya, biarkan useFormDraft yang memulihkannya
    const activeDraftKey = isSurvey
      ? `draft_laporan_survey_${ticket?.id ?? ""}`
      : `draft_laporan_${ticket?.id ?? ""}`;
    const hasDraft = !!sessionStorage.getItem(activeDraftKey);
    if (hasDraft) return; // biarkan draft yang menentukan isi form

    if (isSurvey && ticket) {
      // Auto-fill form survey dari data tiket
      let rawPaket = "";
      const matchCalon = calon.find((c) => c.nama.toLowerCase() === ticket.pel.toLowerCase());
      if (matchCalon) rawPaket = matchCalon.paket;

      let paketAuto = rawPaket;
      const matchingPaket = paketList.find(p => rawPaket.toLowerCase().includes(p.nama.toLowerCase()));
      if (matchingPaket) {
        paketAuto = `${matchingPaket.nama} - Rp ${matchingPaket.harga.toLocaleString("id-ID")}`;
      }

      setSurveyForm({
        namaPelanggan: ticket.pel,
        alamat: ticket.alm,
        noHp: ticket.hp,
        tanggalSurvey: ticket.tglSurvey || "",
        marketing: "",
        teknisiSurvey: currentUser ? `${currentUser.name} (${currentUser.id})` : "",
        paketInternet: paketAuto,
        catatan: "",
      });
    } else if (ticket) {
      // Auto-fill form reguler
      let rawPaket = "";
      let noPelangganAuto = "";

      // 1. Cari dari customerUsers (pelanggan terdaftar) berdasarkan nama
      const matchUser = customerUsers.find(
        (u) => u.name.toLowerCase() === ticket.pel.toLowerCase()
      );
      if (matchUser) {
        noPelangganAuto = matchUser.idPelanggan || "";
      }

      // 2. Cari paket dari customers atau calon
      const matchCustomer = customers.find((c) => c.n.toLowerCase() === ticket.pel.toLowerCase());
      if (matchCustomer) {
        rawPaket = matchCustomer.p;
      } else {
        const matchCalon = calon.find((c) => c.nama.toLowerCase() === ticket.pel.toLowerCase());
        rawPaket = matchCalon ? matchCalon.paket : ticket.mas || "";
      }

      // Coba temukan paket yang cocok dari paketList agar dropdown terpilih otomatis
      let paketAuto = rawPaket;
      const matchingPaket = paketList.find(p => rawPaket.toLowerCase().includes(p.nama.toLowerCase()));
      if (matchingPaket) {
        paketAuto = `${matchingPaket.nama} - Rp ${matchingPaket.harga.toLocaleString("id-ID")}`;
      }

      const keteranganAuto = ticket.jenis === "pemasangan"
        ? `Pemasangan jaringan internet selesai dilakukan di lokasi pelanggan ${ticket.pel}. Semua perangkat terpasang dan koneksi berjalan normal.`
        : `Pemeliharaan/perbaikan jaringan pada pelanggan ${ticket.pel} telah selesai dilakukan. ${ticket.mas}`;

      setForm({
        paket: paketAuto, odp: "", titik: ticket.alm,
        keterangan: keteranganAuto,
        fotoPemeliharaan: [], filePemeliharaan: [],
        noPelanggan: noPelangganAuto, marketing: "",
        serialONU: "", macAddress: "", panjangKabel: "", redaman: "",
        usernamePPPoE: "", passwordPPPoE: "",
        downloadSpeed: "", uploadSpeed: "", statusKoneksi: "Normal",
        fotoInstalasi: [],
      });
      setSelectedOdpId("");
      setSelectedPortNum("1");
      setIsManualOdp(false);
    }
  }, [open, ticket, isSurvey, customers, customerUsers, calon, currentUser]);

  const selectedOdpObj = odpList.find((o) => o.id === selectedOdpId || o.kode === selectedOdpId);

  const handleSelectOdp = (odpId: string) => {
    setSelectedOdpId(odpId);
    if (odpId === "__manual__") {
      setIsManualOdp(true);
      return;
    }
    setIsManualOdp(false);
    const odp = odpList.find((o) => o.id === odpId || o.kode === odpId);
    if (odp) {
      const port = selectedPortNum || "1";
      setForm((p) => ({ ...p, odp: `${odp.kode} / Port ${port}` }));
    }
  };

  const handleSelectPort = (portNum: string) => {
    setSelectedPortNum(portNum);
    if (selectedOdpObj) {
      setForm((p) => ({ ...p, odp: `${selectedOdpObj.kode} / Port ${portNum}` }));
    }
  };

  // ── Draft: simpan & pulihkan form per-tiket jika modal ditutup tidak sengaja ──
  const draftKey     = `draft_laporan_${ticket?.id ?? ""}`;
  const draftKeySurvey = `draft_laporan_survey_${ticket?.id ?? ""}`;
  const { clearDraft }       = useFormDraft(draftKey,      form,       setForm,      open && !isSurvey);
  const { clearDraft: clearDraftSurvey } = useFormDraft(draftKeySurvey, surveyForm, setSurveyForm, open && isSurvey);

  // ── Upload foto / file (pemeliharaan) ──
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setForm((prev) => ({ ...prev, fotoPemeliharaan: [...prev.fotoPemeliharaan, reader.result as string] }));
      reader.readAsDataURL(file);
    });
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setForm((prev) => ({ ...prev, filePemeliharaan: [...prev.filePemeliharaan, reader.result as string] }));
      reader.readAsDataURL(file);
    });
  };
  const removeFoto = (i: number) =>
    setForm((prev) => ({ ...prev, fotoPemeliharaan: prev.fotoPemeliharaan.filter((_, idx) => idx !== i) }));
  const removeFile = (i: number) =>
    setForm((prev) => ({ ...prev, filePemeliharaan: prev.filePemeliharaan.filter((_, idx) => idx !== i) }));

  // ── Upload foto instalasi (pemasangan) ──
  const handleFotoInstalasiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setForm((prev) => ({ ...prev, fotoInstalasi: [...prev.fotoInstalasi, reader.result as string] }));
      reader.readAsDataURL(file);
    });
  };
  const removeFotoInstalasi = (i: number) =>
    setForm((prev) => ({ ...prev, fotoInstalasi: prev.fotoInstalasi.filter((_, idx) => idx !== i) }));

  // ── Signature canvas ──
  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const t = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    setDrawing(true);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#0057B7";
    ctx.lineTo(x, y); ctx.stroke();
    setHasSig(true);
  };
  const end = () => setDrawing(false);
  const clearSig = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    setHasSig(false);
  };

  // ── Submit ──
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    if (!ticket || !currentUser) return;

    if (isSurvey) {
      // Laporan survey — masih pakai TTD karena dilakukan langsung di hadapan calon pelanggan
      if (!hasSig) { alert("Mohon isi tanda tangan calon pelanggan"); return; }
      const ttd = canvasRef.current!.toDataURL("image/png");
      const keteranganSurvey = [
        `Nama Pelanggan   : ${surveyForm.namaPelanggan}`,
        `Alamat Lengkap   : ${surveyForm.alamat}`,
        `Nomor HP         : ${surveyForm.noHp}`,
        `Tanggal Survey   : ${surveyForm.tanggalSurvey}`,
        `Marketing        : ${surveyForm.marketing || "-"}`,
        `Teknisi Survey   : ${surveyForm.teknisiSurvey}`,
        `Paket Internet   : ${surveyForm.paketInternet || "-"}`,
        surveyForm.catatan ? `\nCatatan: ${surveyForm.catatan}` : "",
      ].filter(Boolean).join("\n");

      await addLaporan({
        jenis: ticket.jenis, ticketId: ticket.id, pel: ticket.pel,
        paket: surveyForm.paketInternet || "-",
        odp: "-", titik: surveyForm.alamat,
        keterangan: keteranganSurvey, rating: 0, ttd,
        tek: currentUser.id || "", tekName: currentUser.name,
      });
      clearDraftSurvey();
      onClose();
    } else {
      // Laporan reguler — tanpa rating/saran/TTD (dikirim ke pelanggan via WA)
      const result = await addLaporan({
        jenis: ticket.jenis, ticketId: ticket.id, pel: ticket.pel,
        hp: ticket.hp,
        paket: form.paket, odp: form.odp, titik: form.titik,
        keterangan: form.keterangan, rating: 0, ttd: "",
        tek: currentUser.id || "", tekName: currentUser.name,
        fotoPemeliharaan: ticket.jenis === "pemeliharaan" ? form.fotoPemeliharaan : undefined,
        filePemeliharaan: ticket.jenis === "pemeliharaan" ? form.filePemeliharaan : undefined,
        // Field tambahan pemasangan
        ...(ticket.jenis === "pemasangan" ? {
          noPelanggan: form.noPelanggan,
          marketing: form.marketing,
          serialONU: form.serialONU,
          macAddress: form.macAddress,
          panjangKabel: form.panjangKabel,
          redaman: form.redaman,
          usernamePPPoE: form.usernamePPPoE,
          passwordPPPoE: form.passwordPPPoE,
          hasilSpeedtest: `Download: ${form.downloadSpeed} Mbps / Upload: ${form.uploadSpeed} Mbps`,
          statusKoneksi: form.statusKoneksi,
          fotoInstalasi: form.fotoInstalasi,
        } : {}),
      });
      clearDraft();
      onClose();
    }
  };

  // ── Label judul modal ──
  const modalTitle =
    ticket?.jenis === "survey"      ? "Laporan Survey Calon Pelanggan" :
    ticket?.jenis === "pemasangan"  ? "Laporan Pemasangan" :
    ticket?.jenis === "pemeliharaan"? "Laporan Pemeliharaan" :
                                      "Laporan Tugas";

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        icon={isSurvey ? "fa-search-location" : "fa-clipboard-check"}
        title={modalTitle}
        subtitle={ticket ? `${ticket.id} - ${ticket.pel}` : ""}
        onClose={onClose}
      />
      <div className="modal-body">
        <form onSubmit={submit}>

          {/* ── Ringkasan tiket ── */}
          {ticket && (
            <div style={{
              background: "var(--th-bg, #f8f9fa)", border: "1px solid var(--th-border, #dee2e6)",
              borderRadius: 8, padding: "12px 16px", marginBottom: 16,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: ".85rem",
            }}>
              <div><span style={{ color: "var(--th-muted, #6c757d)" }}>ID Tiket: </span><strong>{ticket.id}</strong></div>
              <div><span style={{ color: "var(--th-muted, #6c757d)" }}>Jenis: </span><strong style={{ textTransform: "capitalize" }}>{ticket.jenis === "survey" ? "Survey Calon Pelanggan" : ticket.jenis}</strong></div>
              <div><span style={{ color: "var(--th-muted, #6c757d)" }}>Pelanggan: </span><strong>{ticket.pel}</strong></div>
              <div><span style={{ color: "var(--th-muted, #6c757d)" }}>HP: </span><strong>{ticket.hp}</strong></div>
              <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "var(--th-muted, #6c757d)" }}>Deskripsi Tiket: </span><strong>{ticket.mas}</strong></div>
            </div>
          )}

          {/* ════════════ FORM SURVEY ════════════ */}
          {isSurvey ? (
            <>
              <div style={{
                background: "rgba(13,110,253,0.04)", border: "1px solid rgba(13,110,253,0.2)",
                borderRadius: 10, padding: "14px 16px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "#0d6efd", fontWeight: 600, fontSize: ".9rem" }}>
                  <i className="fas fa-clipboard-list" /> Data Survey Calon Pelanggan
                </div>

                <div className="form-group">
                  <label>Nama Pelanggan *</label>
                  <input className="form-control" required value={surveyForm.namaPelanggan}
                    onChange={(e) => setSurveyForm((p) => ({ ...p, namaPelanggan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Alamat Lengkap *</label>
                  <textarea className="form-control" required value={surveyForm.alamat}
                    onChange={(e) => setSurveyForm((p) => ({ ...p, alamat: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Nomor HP *</label>
                  <input className="form-control" required type="tel" value={surveyForm.noHp}
                    onChange={(e) => setSurveyForm((p) => ({ ...p, noHp: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Tanggal Survey *</label>
                  <input className="form-control" required type="date" value={surveyForm.tanggalSurvey}
                    onChange={(e) => setSurveyForm((p) => ({ ...p, tanggalSurvey: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>
                    Marketing{" "}
                    <span style={{ fontSize: ".8rem", color: "var(--th-muted,#6c757d)", fontWeight: 400 }}>(Sales yang mereferensikan)</span>
                  </label>
                  <select className="form-control" value={surveyForm.marketing}
                    onChange={(e) => setSurveyForm((p) => ({ ...p, marketing: e.target.value }))}>
                    <option value="">-- Pilih Marketing / Sales --</option>
                    {salesList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}{s.staffId ? ` (${s.staffId})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Teknisi Survey</label>
                  <input className="form-control" readOnly value={surveyForm.teknisiSurvey}
                    style={{ background: "var(--th-bg,#f8f9fa)", cursor: "not-allowed" }} />
                </div>
                <div className="form-group">
                  <label>Paket Internet yang Diminati</label>
                  <select className="form-control" value={surveyForm.paketInternet}
                    onChange={(e) => setSurveyForm((p) => ({ ...p, paketInternet: e.target.value }))}>
                    <option value="">-- Pilih Paket Internet --</option>
                    {paketList.map((p) => (
                      <option key={p.id} value={`${p.nama} - Rp ${p.harga.toLocaleString("id-ID")}`}>
                        {p.nama} - Rp {p.harga.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Catatan Tambahan</label>
                  <textarea className="form-control" rows={2} value={surveyForm.catatan} placeholder="Opsional..."
                    onChange={(e) => setSurveyForm((p) => ({ ...p, catatan: e.target.value }))} />
                </div>
              </div>

              {/* Tanda tangan survey */}
              <div className="form-group">
                <label>Tanda Tangan Calon Pelanggan *</label>
                <div className="sig-wrap">
                  <canvas ref={canvasRef} className="sigpad"
                    onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
                    onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
                  <div className="sig-actions">
                    <span>Tanda tangan di area atas</span>
                    <button type="button" onClick={clearSig}><i className="fas fa-eraser" /> Hapus</button>
                  </div>
                </div>
              </div>
            </>

          ) : (
            /* ════════════ FORM REGULER (Pemasangan / Pemeliharaan) ════════════ */
            <>
              {ticket?.jenis !== "pemasangan" && (
                <div className="form-group">
                  <label>Paket Layanan <span style={{ fontSize: ".8rem", color: "var(--th-muted, #6c757d)", fontWeight: 400 }}>(otomatis dari tiket, bisa diubah)</span> *</label>
                  <select className="form-control" required value={form.paket}
                    onChange={(e) => setForm((p) => ({ ...p, paket: e.target.value }))}>
                    <option value="">-- Pilih Paket Layanan --</option>
                    {paketList.map((p) => (
                      <option key={p.id} value={`${p.nama} - Rp ${p.harga.toLocaleString("id-ID")}`}>
                        {p.nama} - Rp {p.harga.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ── Field tambahan khusus Pemasangan ── */}
              {ticket?.jenis === "pemasangan" && (
                <>
                  <div style={{
                    background: "rgba(14,116,144,0.06)", border: "1px solid rgba(14,116,144,0.2)",
                    borderRadius: 10, padding: "14px 16px", marginBottom: 16,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "#0e7490", fontWeight: 600, fontSize: ".9rem" }}>
                      <i className="fas fa-network-wired" /> Detail Instalasi
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                      {/* ── Pemilihan Titik ODP & Port ── */}
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Titik ODP &amp; Port *</label>
                        <div style={{ display: "grid", gridTemplateColumns: !isManualOdp ? "1.4fr 0.8fr" : "1fr", gap: 10 }}>
                          <select
                            className="form-control"
                            value={isManualOdp ? "__manual__" : selectedOdpId}
                            onChange={(e) => handleSelectOdp(e.target.value)}
                            required
                          >
                            <option value="">-- Pilih Titik ODP --</option>
                            {odpList.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.kode} — {o.wilayah} ({o.alamat}) [{o.terpakai}/{o.kapasitas} Port]
                              </option>
                            ))}
                            <option value="__manual__">+ Input ODP &amp; Port Manual</option>
                          </select>

                          {!isManualOdp && selectedOdpObj && (
                            <select
                              className="form-control"
                              value={selectedPortNum}
                              onChange={(e) => handleSelectPort(e.target.value)}
                              required
                            >
                              {Array.from({ length: selectedOdpObj.kapasitas || 8 }, (_, i) => i + 1).map((pNum) => (
                                <option key={pNum} value={String(pNum)}>
                                  Port {pNum}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {isManualOdp && (
                          <div style={{ marginTop: 8 }}>
                            <input
                              className="form-control"
                              required
                              placeholder="Contoh: ODP-TLG-001 / Port 4"
                              value={form.odp}
                              onChange={(e) => setForm((p) => ({ ...p, odp: e.target.value }))}
                            />
                            <small style={{ color: "#64748b" }}>
                              Format rekomendasi: <code>KODE-ODP / Port X</code>
                            </small>
                          </div>
                        )}

                        {selectedOdpObj && !isManualOdp && (
                          <div
                            style={{
                              marginTop: 8,
                              background: "#fff",
                              border: "1px solid #cbd5e1",
                              borderRadius: 8,
                              padding: "8px 12px",
                              fontSize: ".82rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            <div>
                              <i className="fas fa-map-marker-alt" style={{ color: "#ef4444", marginRight: 4 }} />
                              <strong>{selectedOdpObj.kode} ({selectedOdpObj.wilayah})</strong>: {selectedOdpObj.alamat}
                            </div>
                            <div>
                              <span
                                className={`th-badge ${
                                  selectedOdpObj.status === "penuh" ? "badge-danger" : "badge-info"
                                }`}
                                style={{ fontSize: ".72rem" }}
                              >
                                Terpakai: {selectedOdpObj.terpakai}/{selectedOdpObj.kapasitas} Port
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Serial Number ONU/ONT *</label>
                        <input className="form-control" required value={form.serialONU}
                          onChange={(e) => setForm((p) => ({ ...p, serialONU: e.target.value }))}/>
                      </div>
                      <div className="form-group">
                        <label>MAC Address ONU *</label>
                        <input className="form-control" required value={form.macAddress}
                          onChange={(e) => setForm((p) => ({ ...p, macAddress: e.target.value }))}/>
                      </div>
                      <div className="form-group">
                        <label>Panjang Kabel *</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input className="form-control" required type="number" min="1" value={form.panjangKabel}
                            onChange={(e) => setForm((p) => ({ ...p, panjangKabel: e.target.value }))}
                            placeholder="50" style={{ flex: 1 }} />
                          <span style={{
                            padding: "6px 12px", background: "var(--th-bg, #f0f0f0)",
                            border: "1px solid var(--th-border, #dee2e6)", borderRadius: 6,
                            fontSize: ".88rem", color: "var(--th-muted, #6c757d)", whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}>Meter</span>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Redaman Akhir (dBm) *</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input className="form-control" type="number" required value={form.redaman}
                          onChange={(e) => setForm((p) => ({ ...p, redaman: e.target.value }))}
                          placeholder="-20" />
                          <span style={{
                            padding: "6px 12px", background: "var(--th-bg, #f0f0f0)",
                            border: "1px solid var(--th-border, #dee2e6)", borderRadius: 6,
                            fontSize: ".88rem", color: "var(--th-muted, #6c757d)", whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}>dBm</span>
                        </div>
                      </div>
                      {/* ── Speedtest: 2 kolom Download & Upload ── */}
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Hasil Speedtest *</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                          <div>
                            <label style={{ fontSize: ".82rem", color: "var(--th-muted, #6c757d)", fontWeight: 400, marginBottom: 4, display: "block" }}>
                              <i className="fas fa-arrow-down" style={{ color: "#0d6efd", marginRight: 4 }} /> Download (Mbps) *
                            </label>
                            <input className="form-control" required type="number" min="0" step="0.1" value={form.downloadSpeed}
                              onChange={(e) => setForm((p) => ({ ...p, downloadSpeed: e.target.value }))}
                              placeholder="11" />
                          </div>
                          <div>
                            <label style={{ fontSize: ".82rem", color: "var(--th-muted, #6c757d)", fontWeight: 400, marginBottom: 4, display: "block" }}>
                              <i className="fas fa-arrow-up" style={{ color: "#198754", marginRight: 4 }} /> Upload (Mbps) *
                            </label>
                            <input className="form-control" required type="number" min="0" step="0.1" value={form.uploadSpeed}
                              onChange={(e) => setForm((p) => ({ ...p, uploadSpeed: e.target.value }))}
                              placeholder="5" />
                          </div>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Username PPPoE *</label>
                        <input className="form-control" required value={form.usernamePPPoE}
                          onChange={(e) => setForm((p) => ({ ...p, usernamePPPoE: e.target.value }))}/>
                      </div>
                      <div className="form-group">
                        <label>Password PPPoE *</label>
                        <input className="form-control" required value={form.passwordPPPoE}
                          onChange={(e) => setForm((p) => ({ ...p, passwordPPPoE: e.target.value }))}/>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Status Koneksi *</label>
                      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                        {["Normal", "Belum Normal"].map((s) => (
                          <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 400 }}>
                            <input type="radio" name="statusKoneksi" value={s} required checked={form.statusKoneksi === s}
                              onChange={() => setForm((p) => ({ ...p, statusKoneksi: s }))} />
                            {s}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Foto Dokumentasi Instalasi <span style={{ fontSize: ".8rem", color: "var(--th-muted,#6c757d)", fontWeight: 400 }}>(ODP, ONU, Kabel, Speedtest, Rumah, dll)</span></label>
                    <input className="form-control" type="file" multiple accept="image/*" onChange={handleFotoInstalasiUpload} />
                    {form.fotoInstalasi.length > 0 && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {form.fotoInstalasi.map((foto, i) => (
                          <div key={i} style={{ position: "relative", width: 60, height: 60, border: "1px solid #ccc", borderRadius: 4, overflow: "hidden" }}>
                            <img src={foto} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button type="button" onClick={() => removeFotoInstalasi(i)} style={{ position: "absolute", top: 2, right: 2, background: "red", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", cursor: "pointer" }}><i className="fas fa-times" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Field ODP untuk non-pemasangan */}
              {ticket?.jenis !== "pemasangan" && (
                <div className="form-group">
                  <label>Titik ODP *</label>
                  <div style={{ display: "grid", gridTemplateColumns: !isManualOdp ? "1.4fr 0.8fr" : "1fr", gap: 10 }}>
                    <select
                      className="form-control"
                      value={isManualOdp ? "__manual__" : selectedOdpId}
                      onChange={(e) => handleSelectOdp(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Titik ODP --</option>
                      {odpList.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.kode} — {o.wilayah} ({o.alamat})
                        </option>
                      ))}
                      <option value="__manual__">+ Input ODP Manual</option>
                    </select>

                    {!isManualOdp && selectedOdpObj && (
                      <select
                        className="form-control"
                        value={selectedPortNum}
                        onChange={(e) => handleSelectPort(e.target.value)}
                      >
                        {Array.from({ length: selectedOdpObj.kapasitas || 8 }, (_, i) => i + 1).map((pNum) => (
                          <option key={pNum} value={String(pNum)}>
                            Port {pNum}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {isManualOdp && (
                    <input
                      className="form-control"
                      required
                      style={{ marginTop: 8 }}
                      value={form.odp}
                      onChange={(e) => setForm((p) => ({ ...p, odp: e.target.value }))}
                      placeholder="ODP-JKT-001 / Port 1"
                    />
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Titik Pemasangan / Lokasi *</label>
                <input className="form-control" required value={form.titik}
                  onChange={(e) => setForm((p) => ({ ...p, titik: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Keterangan Laporan <span style={{ fontSize: ".8rem", color: "var(--th-muted, #6c757d)", fontWeight: 400 }}>(otomatis, bisa diubah)</span> *</label>
                <textarea className="form-control" required value={form.keterangan} rows={3}
                  onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))} />
              </div>

              {ticket?.jenis === "pemeliharaan" && (
                <>
                  <div className="form-group">
                    <label>Foto Pemeliharaan</label>
                    <input className="form-control" type="file" multiple accept="image/*" onChange={handleFotoUpload} />
                    {form.fotoPemeliharaan.length > 0 && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {form.fotoPemeliharaan.map((foto, i) => (
                          <div key={i} style={{ position: "relative", width: 60, height: 60, border: "1px solid #ccc", borderRadius: 4, overflow: "hidden" }}>
                            <img src={foto} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button type="button" onClick={() => removeFoto(i)} style={{ position: "absolute", top: 2, right: 2, background: "red", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", cursor: "pointer" }}><i className="fas fa-times" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>File Pemeliharaan (PDF/Doc)</label>
                    <input className="form-control" type="file" multiple accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                    {form.filePemeliharaan.length > 0 && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {form.filePemeliharaan.map((_, i) => (
                          <div key={i} style={{ position: "relative", width: 60, height: 60, border: "1px solid #ccc", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#f8f9fa", fontSize: "1.5rem", color: "#6c757d" }}><i className="fas fa-file-alt" /></div>
                            <button type="button" onClick={() => removeFile(i)} style={{ position: "absolute", top: 2, right: 2, background: "red", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", cursor: "pointer" }}><i className="fas fa-times" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Catatan: Rating, Saran & Kritik, dan Tanda Tangan Pelanggan */}
              {/* kini diisi pelanggan sendiri via link WhatsApp yang dikirimkan setelah submit */}
              <div style={{
                background: "rgba(13,110,253,0.04)", border: "1px solid rgba(13,110,253,0.2)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 8,
                display: "flex", alignItems: "center", gap: 10, fontSize: ".84rem", color: "#0d6efd",
              }}>
                <i className="fab fa-whatsapp" style={{ fontSize: "1.2rem" }} />
                <span>Setelah laporan dikirim, Anda akan mendapat <strong>link penilaian</strong> untuk dikirimkan ke pelanggan via WhatsApp.</span>
              </div>
            </>
          )}

          <button type="submit" className="th-btn th-btn-primary" style={{ width: "100%" }}>
            <i className="fas fa-paper-plane" /> {isSurvey ? "Kirim Laporan Survey" : "Kirim Laporan"}
          </button>
        </form>
      </div>

      <CustomConfirmModal 
        open={showConfirm} 
        onCancel={() => setShowConfirm(false)} 
        onConfirm={handleConfirmSubmit} 
      />
    </Modal>
  );
}

function CustomConfirmModal({ open, onConfirm, onCancel }: { open: boolean, onConfirm: () => void, onCancel: () => void }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999,
      animation: "fadeIn 0.2s ease"
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "32px 24px", width: "90%", maxWidth: 360,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)", textAlign: "center",
        transform: "scale(1)", animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      }}>
        <div style={{
          width: 72, height: 72, background: "#E8F0FE", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
          color: "#1A73E8", fontSize: "2.5rem"
        }}>
          <i className="fas fa-question-circle" />
        </div>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.25rem", color: "#202124", fontWeight: 700 }}>Konfirmasi Laporan</h3>
        <p style={{ margin: "0 0 28px", color: "#5f6368", fontSize: ".95rem", lineHeight: 1.5 }}>
          Apakah benar data sudah tersimpan dengan benar?
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#f1f3f4",
            color: "#3c4043", fontWeight: 600, fontSize: ".95rem", cursor: "pointer", transition: "all .2s"
          }}>
            Batal
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#1A73E8",
            color: "#fff", fontWeight: 600, fontSize: ".95rem", cursor: "pointer", transition: "all .2s",
            boxShadow: "0 4px 12px rgba(26,115,232,0.3)"
          }}>
            Ya, Simpan
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
