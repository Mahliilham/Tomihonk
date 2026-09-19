import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { StarsStatic } from "@/lib/format";
import LaporanModal from "@/components/modals/LaporanModal";
import type { Ticket } from "@/lib/types";

type Tab = "dashboard" | "tiket" | "laporan";
const TABS: { k: Tab; ic: string; l: string }[] = [
  { k: "dashboard", ic: "fa-tachometer-alt", l: "Dashboard" },
  { k: "tiket", ic: "fa-ticket-alt", l: "Tiket Saya" },
  { k: "laporan", ic: "fa-file-alt", l: "Laporan Saya" },
];

const stBadge = (s: string) => ({
  pending: "badge-warning", proses: "badge-info", selesai: "badge-success",
}[s] || "badge-info");

export default function TeknisiDashboard() {
  const { currentUser, logout, tickets, refreshTickets, laporan } = useApp();
  const [tab, setTabRaw] = useState<Tab>(
    () => (localStorage.getItem("teknisi_tab") as Tab | null) || "dashboard"
  );
  const setTab = (t: Tab) => { setTabRaw(t); localStorage.setItem("teknisi_tab", t); if (t === "tiket") refreshTickets(); };
  const [lapModal, setLapModal] = useState<{ open: boolean; ticket: Ticket | null }>({ open: false, ticket: null });
  const [detailLaporan, setDetailLaporan] = useState<typeof laporan[0] | null>(null);
  const [surveyDetail, setSurveyDetail] = useState<Ticket | null>(null);

  const myId = currentUser?.id || "";
  const myTickets = useMemo(() => tickets.filter((t) => t.tek === myId), [tickets, myId]);
  // Hanya tiket aktif (belum selesai) yang tampil di "Tiket Saya"
  const activeTickets = useMemo(() => myTickets.filter((t) => t.st !== "selesai"), [myTickets]);
  const myLaporan = useMemo(() => laporan.filter((l) => l.tek === myId), [laporan, myId]);

  const stats = {
    aktif: activeTickets.length,
    selesai: myTickets.filter((t) => t.st === "selesai").length,
    laporan: myLaporan.length,
  };

  return (
    <div className="dashboard" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className="dash-topbar">
        <div className="th-logo"><i className="fas fa-wifi" /> Tomihonk Teknisi</div>
        <div className="dash-user">
          <div className="dash-user-info">
            <h5>{currentUser?.name}</h5>
            <p>Teknisi - {currentUser?.id}</p>
          </div>
          <div className="dash-avatar">{currentUser?.name.charAt(0)}</div>
          <button className="th-btn th-btn-outline th-btn-sm" onClick={logout}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </div>
      <div className="dash-body">
        <aside className="th-sidebar">
          <ul className="sidebar-menu">
            {TABS.map((t) => (
              <li key={t.k}><a className={tab === t.k ? "active" : ""} onClick={() => setTab(t.k)}>
                <i className={`fas ${t.ic}`} /><span>{t.l}</span></a></li>
            ))}
          </ul>
        </aside>
        <main className="dash-content">
          <div className="tech-profile">
            <div className="avatar-lg">{currentUser?.name.charAt(0)}</div>
            <div>
              <h3>{currentUser?.name}</h3>
              <p><i className="fas fa-id-badge" /> {currentUser?.id} &nbsp;·&nbsp; <i className="fas fa-tools" /> Teknisi Lapangan</p>
            </div>
          </div>

          {tab === "dashboard" && (
            <>
              <div className="dash-stats">
                <div className="dash-stat"><div className="ic b1"><i className="fas fa-tasks" /></div><div><h3>{stats.aktif}</h3><p>Tugas Aktif</p></div></div>
                <div className="dash-stat"><div className="ic b3"><i className="fas fa-check-circle" /></div><div><h3>{stats.selesai}</h3><p>Tugas Selesai</p></div></div>
                <div className="dash-stat"><div className="ic b2"><i className="fas fa-file-alt" /></div><div><h3>{stats.laporan}</h3><p>Total Laporan</p></div></div>
              </div>
            </>
          )}

          {(tab === "dashboard" || tab === "tiket") && (
            <div className="dash-card">
              <div className="dash-card-head"><h3>Tiket Saya</h3></div>
              <div className="table-wrap">
                <table className="th-table">
                  <thead><tr><th>ID</th><th>Pelanggan</th><th>Alamat</th><th>Jenis</th><th>Estimasi</th><th>Status</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {activeTickets.length === 0 ? (
                      <tr><td colSpan={7}><div className="empty-state"><i className="fas fa-check-circle" /><p>Semua tugas selesai!</p></div></td></tr>
                    ) : activeTickets.map((t) => (
                      <tr key={t.id}><td>{t.id}</td><td>{t.pel}</td><td>{t.alm}</td>
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 12, fontSize: ".8rem", fontWeight: 600,
                            background: t.jenis === "survey" ? "rgba(13,110,253,0.1)" : t.jenis === "pemasangan" ? "rgba(25,135,84,0.1)" : t.jenis === "pemeliharaan" ? "rgba(255,193,7,0.1)" : "rgba(108,117,125,0.1)",
                            color: t.jenis === "survey" ? "#0d6efd" : t.jenis === "pemasangan" ? "#198754" : t.jenis === "pemeliharaan" ? "#856404" : "#6c757d",
                          }}>
                            <i className={`fas ${ t.jenis === "survey" ? "fa-search-location" : t.jenis === "pemasangan" ? "fa-tools" : t.jenis === "pemeliharaan" ? "fa-wrench" : "fa-minus-circle" }`} />
                            {t.jenis === "survey" ? "Survey Calon" : t.jenis === "pemasangan" ? "Pemasangan" : t.jenis === "pemeliharaan" ? "Pemeliharaan" : "Dismantle"}
                          </span>
                        </td>
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
                            <span style={{ color: "#adb5bd", fontSize: ".82rem" }}>-</span>
                          )}
                        </td>
                        <td><span className={`th-badge ${stBadge(t.st)}`}>{t.st}</span></td>
                        <td>
                          {t.jenis === "survey" && (
                            <button className="act-btn" style={{ background: "rgba(13,110,253,0.12)", color: "#0d6efd" }}
                              onClick={() => setSurveyDetail(surveyDetail?.id === t.id ? null : t)}>
                              <i className="fas fa-info-circle" /> Detail
                            </button>
                          )}
                          {t.st !== "selesai" && (
                            <button className="act-btn lap" onClick={() => setLapModal({ open: true, ticket: t })}>
                              <i className="fas fa-clipboard-check" /> Lapor
                            </button>
                          )}
                        </td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Card detail tiket survey ── */}
          {surveyDetail && (tab === "dashboard" || tab === "tiket") && (
            <div className="dash-card" style={{ marginTop: 16, border: "1px solid rgba(13,110,253,0.3)", background: "rgba(13,110,253,0.04)" }}>
              <div className="dash-card-head" style={{ background: "rgba(13,110,253,0.08)" }}>
                <h3 style={{ color: "#0d6efd", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fas fa-search-location" /> Detail Survey Calon Pelanggan — {surveyDetail.id}
                </h3>
                <button className="act-btn" style={{ background: "none", color: "#6c757d", padding: "4px 8px" }}
                  onClick={() => setSurveyDetail(null)}>
                  <i className="fas fa-times" />
                </button>
              </div>
              <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                <div>
                  <small style={{ color: "#6c757d", display: "block" }}>Nama Pelanggan</small>
                  <strong>{surveyDetail.pel}</strong>
                </div>
                <div>
                  <small style={{ color: "#6c757d", display: "block" }}>Nomor HP</small>
                  <strong>{surveyDetail.hp}</strong>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <small style={{ color: "#6c757d", display: "block" }}>Alamat Lengkap</small>
                  <strong>{surveyDetail.alm}</strong>
                </div>
                <div>
                  <small style={{ color: "#6c757d", display: "block" }}>Tanggal Survey</small>
                  <strong>{surveyDetail.tglSurvey || <em style={{ color: "#999", fontWeight: 400 }}>Belum ditentukan</em>}</strong>
                </div>
                <div>
                  <small style={{ color: "#6c757d", display: "block" }}>Teknisi Survey</small>
                  <strong>{currentUser?.name} ({currentUser?.id})</strong>
                </div>
                <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
                  <button className="th-btn th-btn-primary" style={{ width: "100%" }}
                    onClick={() => setLapModal({ open: true, ticket: surveyDetail })}>
                    <i className="fas fa-clipboard-check" /> Buat Laporan Survey
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "laporan" && (
            <div className="dash-card">
              <div className="dash-card-head"><h3>Laporan Saya</h3></div>
              <div className="table-wrap">
                <table className="th-table">
                  <thead><tr><th>Tgl</th><th>Tiket</th><th>Pelanggan</th><th>Jenis</th><th>Rating</th><th>TTD</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {myLaporan.length === 0 ? (
                      <tr><td colSpan={7}><div className="empty-state"><i className="fas fa-file-alt" /><p>Belum ada laporan</p></div></td></tr>
                    ) : myLaporan.map((l) => (
                      <tr key={l.id}><td>{l.tgl}</td><td>{l.ticketId}</td><td>{l.pel}</td><td>{l.jenis}</td>
                        <td><StarsStatic n={l.rating} /></td>
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
        </main>
      </div>

      <LaporanModal open={lapModal.open} ticket={lapModal.ticket}
        onClose={() => setLapModal({ open: false, ticket: null })} />

      {detailLaporan && (
        <div className="lightbox" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: 600, background: "#fff", padding: 24, borderRadius: 12, position: "relative" }}>
            <span className="lightbox-close" onClick={() => setDetailLaporan(null)} style={{ color: "#333", background: "#f0f0f0" }}>
              <i className="fas fa-times" />
            </span>
            <h3 style={{ marginBottom: 16 }}>Detail Laporan {detailLaporan.jenis === "pemasangan" ? "Pemasangan" : "Pemeliharaan"}</h3>
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
    </div>
  );
}
