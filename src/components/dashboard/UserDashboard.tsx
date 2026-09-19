import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { fmtRp } from "@/lib/format";
import CalonModal from "@/components/modals/CalonModal";
import type { CustomerUser } from "@/lib/types";
import Swal from "sweetalert2";

export default function UserDashboard() {
  const { currentUser, logout, customerUsers, tagihanList, tickets, calon, addKeluhan, refreshCustomerUsers, pushNotif } = useApp();
  const [calonOpen, setCalonOpen] = useState(false);
  const [defaultPaket, setDefaultPaket] = useState<string | undefined>();
  const [keluhanPesan, setKeluhanPesan] = useState("");
  const [activeTab, setActiveTab] = useState<"profil" | "tagihan" | "layanan" | "keluhan">("profil");

  // Cari data user lengkap dari customerUsers berdasarkan username atau ID
  const userDetail: CustomerUser | undefined = customerUsers.find(
    (u) => u.username === currentUser?.id || u.name === currentUser?.name || u.idPelanggan === currentUser?.id
  );

  const hasIdPelanggan = Boolean(userDetail?.idPelanggan || (currentUser?.id && currentUser.id.startsWith("PLG-")));
  const idPelanggan = userDetail?.idPelanggan || (currentUser?.id?.startsWith("PLG-") ? currentUser.id : null);
  const isAktif = userDetail ? userDetail.status === "aktif" : hasIdPelanggan;

  // Cek apakah user ini sudah pernah mengajukan form calon pemasangan
  const myCalonRegistration = calon.find(
    (c) =>
      (userDetail?.hp && c.hp === userDetail.hp) ||
      (userDetail?.email && c.email === userDetail.email) ||
      (currentUser?.name && c.nama.toLowerCase() === currentUser.name.toLowerCase())
  );

  // Otomatis buka form pemasangan jika baru selesai register
  useEffect(() => {
    const shouldAutoOpen = sessionStorage.getItem("auto_open_calon");
    const savedPaket = sessionStorage.getItem("selected_paket");
    if (shouldAutoOpen === "true" && !hasIdPelanggan && !myCalonRegistration) {
      if (savedPaket) setDefaultPaket(savedPaket);
      setCalonOpen(true);
      sessionStorage.removeItem("auto_open_calon");
      sessionStorage.removeItem("selected_paket");
    }
  }, [hasIdPelanggan, myCalonRegistration]);

  // Handler klik Pasang Internet (dengan proteksi jika sudah punya akun/terdaftar)
  const handleKlikPasang = () => {
    if (hasIdPelanggan) {
      Swal.fire({
        title: "Layanan Sudah Aktif",
        text: `Akun Anda sudah memiliki ID Pelanggan (${idPelanggan}) dan layanan aktif. Anda tidak perlu mendaftar lagi.`,
        icon: "info",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    if (myCalonRegistration) {
      Swal.fire({
        title: "Pengajuan Sedang Diproses",
        text: `Anda sudah memiliki pengajuan pemasangan aktif untuk paket ${myCalonRegistration.paket} (Status: ${myCalonRegistration.status.toUpperCase()}). Tim kami akan segera menghubungi Anda.`,
        icon: "warning",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    setCalonOpen(true);
  };

  // Filter tagihan milik user ini
  const myTagihan = tagihanList.filter(
    (t) =>
      (idPelanggan && t.pelanggan.toLowerCase().includes(idPelanggan.toLowerCase())) ||
      (currentUser?.name && t.pelanggan.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  // Filter tiket milik user ini
  const myTickets = tickets.filter(
    (t) =>
      currentUser?.name && t.pel.toLowerCase().includes(currentUser.name.toLowerCase())
  );

  const handleKirimKeluhan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keluhanPesan.trim()) return;
    addKeluhan({
      nama: `${currentUser?.name || "Pelanggan"}${idPelanggan ? ` (${idPelanggan})` : ""}`,
      pesan: keluhanPesan.trim(),
    });
    setKeluhanPesan("");
  };

  const handleBerhentiLangganan = async () => {
    const result = await Swal.fire({
      title: "Berhenti Langganan?",
      html: `
        <div style="text-align:left;font-size:.92rem;color:#475569;">
          <p>Anda yakin ingin <strong>berhenti berlangganan</strong> layanan internet Tomihonk?</p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:12px 0;">
            <strong style="color:#dc2626;">⚠️ Perhatian:</strong>
            <ul style="margin:8px 0 0;padding-left:18px;color:#7f1d1d;">
              <li>Teknisi akan dijadwalkan untuk pencabutan perangkat</li>
              <li>Koneksi internet akan diputus setelah proses selesai</li>
              <li>ID Pelanggan Anda akan dinonaktifkan</li>
            </ul>
          </div>
          <p style="margin-bottom:0;">Silakan masukkan <strong>alasan berhenti</strong>:</p>
        </div>
      `,
      input: "textarea",
      inputPlaceholder: "Contoh: Pindah rumah, ganti provider, dll...",
      inputAttributes: { "aria-label": "Alasan berhenti langganan" },
      showCancelButton: true,
      confirmButtonText: "Ya, Berhenti Langganan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Mohon isi alasan berhenti langganan.";
      },
    });

    if (result.isConfirmed && result.value) {
      const alasan = result.value.trim();
      const namaUser = currentUser?.name || "Pelanggan";
      const hp = userDetail?.hp || "-";
      const alamat = userDetail?.alamat || "-";

      // Kirim notifikasi ke admin
      pushNotif(
        "admin",
        "🔴 Permintaan Berhenti Langganan",
        `${namaUser} (${idPelanggan || "-"}) mengajukan berhenti langganan. HP: ${hp}, Alamat: ${alamat}. Alasan: ${alasan}`
      );

      Swal.fire({
        title: "Permintaan Terkirim",
        html: `
          <div style="text-align:left;font-size:.9rem;color:#475569;">
            <p>Permintaan berhenti langganan Anda telah dikirim ke admin.</p>
            <p>Admin akan membuat tiket <strong>pencabutan (dismantle)</strong> dan teknisi akan menghubungi Anda untuk menjadwalkan waktu pencabutan perangkat.</p>
            <p style="color:#64748b;font-size:.82rem;margin-top:12px;">
              <i class="fas fa-info-circle"></i> Anda bisa melihat status proses pencabutan di tab <strong>Layanan Internet</strong>.
            </p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#f97316",
      });
    }
  };

  return (
    <div className="dashboard" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Topbar */}
      <div className="dash-topbar" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
        <div className="th-logo">
          <i className="fas fa-wifi" style={{ color: "var(--th-accent, #f97316)" }} /> Tomihonk Pelanggan
        </div>
        <div className="dash-user">
          <div className="dash-user-info">
            <h5>{currentUser?.name}</h5>
            <p>
              {hasIdPelanggan ? (
                <span className="th-badge badge-success" style={{ fontSize: ".72rem", padding: "2px 8px" }}>
                  <i className="fas fa-check-circle" /> {idPelanggan} (Aktif)
                </span>
              ) : myCalonRegistration ? (
                <span className="th-badge badge-info" style={{ fontSize: ".72rem", padding: "2px 8px" }}>
                  <i className="fas fa-spinner fa-spin" /> Pemasangan Diproses
                </span>
              ) : (
                <span className="th-badge badge-warning" style={{ fontSize: ".72rem", padding: "2px 8px" }}>
                  <i className="fas fa-clock" /> Belum Pasang Internet
                </span>
              )}
            </p>
          </div>
          <div className="dash-avatar" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
            {currentUser?.name.charAt(0)}
          </div>
          <button className="th-btn th-btn-outline th-btn-sm" onClick={logout}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </div>

      <div className="dash-body">
        {/* Sidebar Nav */}
        <aside className="th-sidebar" style={{ width: 240 }}>
          <ul className="sidebar-menu">
            <li>
              <a className={activeTab === "profil" ? "active" : ""} onClick={() => setActiveTab("profil")}>
                <i className="fas fa-user-circle" />
                <span>Profil &amp; Status</span>
              </a>
            </li>
            <li>
              <a className={activeTab === "layanan" ? "active" : ""} onClick={() => setActiveTab("layanan")}>
                <i className="fas fa-network-wired" />
                <span>Layanan Internet</span>
              </a>
            </li>
            <li>
              <a className={activeTab === "tagihan" ? "active" : ""} onClick={() => setActiveTab("tagihan")}>
                <i className="fas fa-file-invoice-dollar" />
                <span>Tagihan Saya</span>
              </a>
            </li>
            <li>
              <a className={activeTab === "keluhan" ? "active" : ""} onClick={() => setActiveTab("keluhan")}>
                <i className="fas fa-headset" />
                <span>Bantuan &amp; Keluhan</span>
              </a>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="dash-content" style={{ padding: "24px", overflowY: "auto" }}>
          {/* Status Banner */}
          <div
            style={{
              background: hasIdPelanggan
                ? "linear-gradient(135deg, #065f46 0%, #047857 100%)"
                : myCalonRegistration
                ? "linear-gradient(135deg, #0369a1 0%, #0284c7 100%)"
                : "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
              color: "#fff",
              borderRadius: "14px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <span
                style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: ".8rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <i
                  className={
                    hasIdPelanggan
                      ? "fas fa-shield-check"
                      : myCalonRegistration
                      ? "fas fa-hourglass-half"
                      : "fas fa-info-circle"
                  }
                />
                {hasIdPelanggan
                  ? "Pelanggan Terverifikasi"
                  : myCalonRegistration
                  ? "Pendaftaran Sedang Diproses"
                  : "Akun Belum Pasang Internet"}
              </span>
              <h2 style={{ color: "#fff", margin: "4px 0 8px", fontSize: "1.6rem" }}>
                Halo, {currentUser?.name}!
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: ".92rem", maxWidth: 600 }}>
                {hasIdPelanggan
                  ? `ID Pelanggan Anda adalah ${idPelanggan}. Layanan internet Anda saat ini aktif dan terhubung ke jaringan fiber optic Tomihonk.`
                  : myCalonRegistration
                  ? `Pendaftaran pemasangan untuk paket ${myCalonRegistration.paket} telah kami terima. Tim teknisi akan menghubungi Anda untuk konfirmasi jadwal survey & instalasi.`
                  : "Anda telah terdaftar sebagai user Tomihonk. Pasang layanan internet kami sekarang untuk mendapatkan ID Pelanggan resmi dan nikmati koneksi super cepat!"}
              </p>
            </div>

            {!hasIdPelanggan && (
              <button
                className="th-btn"
                onClick={handleKlikPasang}
                style={{
                  background: "#fff",
                  color: myCalonRegistration ? "#0369a1" : "#b45309",
                  fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                }}
              >
                <i className={myCalonRegistration ? "fas fa-check-circle" : "fas fa-plus-circle"} />{" "}
                {myCalonRegistration ? "Lihat Status Pendaftaran" : "Pasang Internet Sekarang"}
              </button>
            )}
          </div>

          {/* TAB: PROFIL */}
          {activeTab === "profil" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              <div className="dash-card">
                <div className="dash-card-head">
                  <h3><i className="fas fa-id-card" style={{ marginRight: 8, color: "#3b82f6" }} /> Informasi Akun</h3>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                      <span style={{ color: "#64748b" }}>Status Pelanggan:</span>
                      <span>
                        {hasIdPelanggan ? (
                          <strong className="th-badge badge-success">Aktif (Punya ID Pelanggan)</strong>
                        ) : myCalonRegistration ? (
                          <strong className="th-badge badge-info">Pendaftaran Diproses</strong>
                        ) : (
                          <strong className="th-badge badge-warning">Belum Pasang (Tanpa ID)</strong>
                        )}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                      <span style={{ color: "#64748b" }}>ID Pelanggan:</span>
                      <strong>{idPelanggan || <em style={{ color: "#94a3b8" }}>Belum Ada</em>}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                      <span style={{ color: "#64748b" }}>Username:</span>
                      <strong>{userDetail?.username || currentUser?.id}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                      <span style={{ color: "#64748b" }}>Nama Lengkap:</span>
                      <strong>{currentUser?.name}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                      <span style={{ color: "#64748b" }}>No. HP / WhatsApp:</span>
                      <strong>{userDetail?.hp || "-"}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                      <span style={{ color: "#64748b" }}>Email:</span>
                      <strong>{userDetail?.email || "-"}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b" }}>Alamat Pemasangan:</span>
                      <span style={{ textAlign: "right", maxWidth: 200 }}>{userDetail?.alamat || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Layanan Card */}
              <div className="dash-card">
                <div className="dash-card-head">
                  <h3><i className="fas fa-signal" style={{ marginRight: 8, color: "#10b981" }} /> Status Layanan</h3>
                </div>
                <div style={{ padding: 20 }}>
                  {hasIdPelanggan ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, background: "#f0fdf4", padding: 14, borderRadius: 10, border: "1px solid #bbf7d0" }}>
                        <i className="fas fa-check-circle" style={{ fontSize: "1.8rem", color: "#16a34a" }} />
                        <div>
                          <h4 style={{ margin: 0, color: "#166534" }}>Koneksi Internet Aktif</h4>
                          <p style={{ margin: 0, fontSize: ".84rem", color: "#15803d" }}>Layanan internet fiber optic beroperasi normal.</p>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                          <small style={{ color: "#64748b" }}>Paket Aktif</small>
                          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a" }}>Fiber Unlimited</div>
                        </div>
                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                          <small style={{ color: "#64748b" }}>Bantuan Teknis</small>
                          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#16a34a" }}>24/7 Siaga</div>
                        </div>
                      </div>

                      {/* Berhenti Langganan */}
                      <div style={{
                        marginTop: 20, paddingTop: 16,
                        borderTop: "1px solid #e2e8f0",
                      }}>
                        <div style={{
                          background: "#fef2f2", border: "1px solid #fecaca",
                          borderRadius: 10, padding: "14px 16px",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          flexWrap: "wrap", gap: 12,
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#991b1b", fontSize: ".9rem", marginBottom: 2 }}>
                              <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }} />
                              Ingin berhenti berlangganan?
                            </div>
                            <p style={{ margin: 0, fontSize: ".8rem", color: "#7f1d1d" }}>
                              Perangkat akan dicabut oleh teknisi setelah permintaan disetujui admin.
                            </p>
                          </div>
                          <button
                            onClick={handleBerhentiLangganan}
                            style={{
                              padding: "8px 16px", borderRadius: 8, border: "1px solid #dc2626",
                              background: "#fff", color: "#dc2626", fontWeight: 600,
                              fontSize: ".84rem", cursor: "pointer", display: "flex",
                              alignItems: "center", gap: 6, transition: "all .2s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#dc2626"; }}
                          >
                            <i className="fas fa-times-circle" /> Berhenti Langganan
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : myCalonRegistration ? (
                    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <i className="fas fa-spinner fa-spin" style={{ color: "#0284c7", fontSize: "1.3rem" }} />
                        <h4 style={{ margin: 0, color: "#0369a1" }}>Pengajuan Pemasangan Diproses</h4>
                      </div>
                      <p style={{ fontSize: ".86rem", color: "#0c4a6e", marginBottom: 10 }}>
                        Data pendaftaran Anda telah tercatat pada tanggal <strong>{myCalonRegistration.tgl}</strong>.
                      </p>
                      <div style={{ background: "#fff", padding: 10, borderRadius: 6, fontSize: ".82rem", display: "flex", flexDirection: "column", gap: 6 }}>
                        <div><strong>Paket:</strong> {myCalonRegistration.paket}</div>
                        <div><strong>Alamat:</strong> {myCalonRegistration.alamat}</div>
                        <div><strong>Status:</strong> <span className="th-badge badge-info">{myCalonRegistration.status.toUpperCase()}</span></div>
                        <div>
                          <strong>Estimasi Pemasangan:</strong>{" "}
                          {(() => {
                            const pTiket = myTickets.find((t) => t.jenis === "pemasangan");
                            if (pTiket && (pTiket.estimasiMulai || pTiket.estimasiSelesai)) {
                              const mulai = pTiket.estimasiMulai;
                              const selesai = pTiket.estimasiSelesai;
                              const text = mulai && selesai ? `${mulai} - ${selesai}` : mulai ? `Mulai ${mulai}` : `Selesai ${selesai}`;
                              return (
                                <span style={{ color: "#0369a1", fontWeight: 600 }}>
                                  {text}
                                </span>
                              );
                            }
                            return <span style={{ color: "#64748b" }}>Menunggu Jadwal</span>;
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px 10px" }}>
                      <i className="fas fa-exclamation-triangle" style={{ fontSize: "2.5rem", color: "#f59e0b", marginBottom: 12 }} />
                      <h4>Belum Ada Layanan Aktif</h4>
                      <p style={{ color: "#64748b", fontSize: ".88rem", marginBottom: 16 }}>
                        Anda baru mendaftar akun pengguna. Dapatkan koneksi internet fiber sekarang untuk mengaktifkan ID Pelanggan.
                      </p>
                      <button className="th-btn th-btn-primary th-btn-sm" onClick={handleKlikPasang}>
                        <i className="fas fa-plus" /> Ajukan Pemasangan Baru
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: LAYANAN */}
          {activeTab === "layanan" && (
            <div className="dash-card">
              <div className="dash-card-head">
                <h3>Informasi Pemasangan &amp; Tiket</h3>
              </div>
              <div className="table-wrap">
                {myTickets.length > 0 ? (
                  <table className="th-table">
                    <thead>
                      <tr>
                        <th>ID Tiket</th>
                        <th>Jenis</th>
                        <th>Keterangan / Masalah</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTickets.map((tk) => (
                        <tr key={tk.id}>
                          <td><strong>{tk.id}</strong></td>
                          <td><span className="th-badge badge-info">{tk.jenis}</span></td>
                          <td>{tk.mas}</td>
                          <td>
                            <span className={`th-badge ${tk.st === "selesai" ? "badge-success" : tk.st === "proses" ? "badge-info" : "badge-warning"}`}>
                              {tk.st.toUpperCase()}
                            </span>
                          </td>
                          <td>{tk.tgl}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : myCalonRegistration ? (
                  <div style={{ padding: "24px 20px", background: "#f8fafc" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <i className="fas fa-clipboard-check" style={{ color: "#0284c7", fontSize: "1.2rem" }} />
                      <h4 style={{ margin: 0 }}>Pengajuan Pemasangan</h4>
                    </div>
                    <p style={{ color: "#64748b", fontSize: ".86rem", margin: "0 0 12px" }}>
                      Data Anda telah terdaftar sebagai calon pelanggan. Tiket pemasangan akan otomatis dibuat setelah proses verifikasi admin &amp; survey selesai.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: ".84rem" }}>
                      <div><strong>Nama:</strong> {myCalonRegistration.nama}</div>
                      <div><strong>Paket:</strong> {myCalonRegistration.paket}</div>
                      <div><strong>No. HP:</strong> {myCalonRegistration.hp}</div>
                      <div><strong>Status:</strong> <span className="th-badge badge-info">{myCalonRegistration.status}</span></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                    <i className="fas fa-ticket-alt" style={{ fontSize: "2rem", marginBottom: 10, display: "block", color: "#cbd5e1" }} />
                    Belum ada riwayat tiket pemasangan atau perbaikan.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TAGIHAN */}
          {activeTab === "tagihan" && (
            <div className="dash-card">
              <div className="dash-card-head">
                <h3>Riwayat &amp; Status Tagihan</h3>
              </div>
              <div className="table-wrap">
                {myTagihan.length > 0 ? (
                  <table className="th-table">
                    <thead>
                      <tr>
                        <th>No. Tagihan</th>
                        <th>Bulan / Tahun</th>
                        <th>Jumlah</th>
                        <th>Jatuh Tempo</th>
                        <th>Status</th>
                        <th>Metode Bayar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTagihan.map((tg) => (
                        <tr key={tg.id}>
                          <td><strong>{tg.noTagihan}</strong></td>
                          <td>{tg.bulan} / {tg.tahun}</td>
                          <td><strong>{fmtRp(tg.jumlah)}</strong></td>
                          <td>{tg.jatuhTempo}</td>
                          <td>
                            <span className={`th-badge ${tg.status === "lunas" ? "badge-success" : tg.status === "isolasi" ? "badge-danger" : "badge-warning"}`}>
                              {tg.status === "lunas" ? "Lunas" : tg.status === "isolasi" ? "Terisolir" : "Belum Bayar"}
                            </span>
                          </td>
                          <td>{tg.metodeBayar || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                    <i className="fas fa-receipt" style={{ fontSize: "2rem", marginBottom: 10, display: "block", color: "#cbd5e1" }} />
                    {hasIdPelanggan ? "Belum ada catatan tagihan untuk akun Anda." : "Tagihan akan muncul setelah internet Anda terpasang dan aktif."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: KELUHAN */}
          {activeTab === "keluhan" && (
            <div style={{ maxWidth: 640 }}>
              <div className="dash-card">
                <div className="dash-card-head">
                  <h3><i className="fas fa-comment-dots" style={{ marginRight: 8, color: "#3b82f6" }} /> Lapor Gangguan / Keluhan</h3>
                </div>
                <div style={{ padding: 20 }}>
                  <p style={{ color: "#64748b", fontSize: ".88rem", marginBottom: 16 }}>
                    Jika koneksi internet Anda bermasalah atau Anda memiliki pertanyaan, silakan tulis pesan di bawah ini. Tim kami akan segera menindaklanjuti.
                  </p>
                  <form onSubmit={handleKirimKeluhan}>
                    <div className="form-group">
                      <label>Deskripsi Gangguan / Pesan</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        required
                        value={keluhanPesan}
                        onChange={(e) => setKeluhanPesan(e.target.value)}
                        placeholder="Jelaskan kendala yang dialami secara detail..."
                      />
                    </div>
                    <button type="submit" className="th-btn th-btn-primary">
                      <i className="fas fa-paper-plane" /> Kirim Keluhan
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <CalonModal open={calonOpen} defaultPaket={defaultPaket} onClose={() => setCalonOpen(false)} />
    </div>
  );
}
