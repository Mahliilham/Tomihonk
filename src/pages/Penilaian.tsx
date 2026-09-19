import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface LaporanInfo {
  id: string;
  pel: string;
  jenis: string;
  tgl: string;
  tekName: string;
  ticketId: string;
  feedbackSubmitted: boolean;
}

type Stage = "loading" | "error" | "done_already" | "form" | "success";

export default function Penilaian() {
  const [params] = useSearchParams();
  const id = params.get("id") || "";

  const [stage, setStage] = useState<Stage>("loading");
  const [laporan, setLaporan] = useState<LaporanInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [saran, setSaran] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Ambil info laporan ──
  useEffect(() => {
    if (!id) { setStage("error"); return; }
    fetch(`/api/laporan/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setStage("error"); return; }
        setLaporan(data);
        if (data.feedbackSubmitted) setStage("done_already");
        else setStage("form");
      })
      .catch(() => setStage("error"));
  }, [id]);

  // ── Init canvas saat form muncul ──
  useEffect(() => {
    if (stage !== "form" || !canvasRef.current) return;
    const c = canvasRef.current;
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
  }, [stage]);

  // ── Canvas helpers ──
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const t = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    setDrawing(true);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#1e3a5f";
    ctx.lineTo(x, y); ctx.stroke();
    setHasSig(true);
  };
  const endDraw = () => setDrawing(false);
  const clearSig = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    setHasSig(false);
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { alert("Mohon berikan rating terlebih dahulu"); return; }
    if (!hasSig) { alert("Mohon tanda tangan terlebih dahulu"); return; }
    const ttd = canvasRef.current!.toDataURL("image/png");

    setSubmitting(true);
    try {
      const res = await fetch(`/api/laporan/${id}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, saranKritik: saran, ttd }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Gagal mengirim penilaian"); return; }
      setStage("success");
    } catch {
      alert("Terjadi kesalahan koneksi. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const jenisLabel: Record<string, string> = {
    pemasangan: "Pemasangan", pemeliharaan: "Pemeliharaan",
    survey: "Survey", dismantle: "Pencabutan",
  };
  const starLabel = ["", "Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f2944 0%,#1e4d8c 60%,#0d6efd 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", backdropFilter: "blur(8px)" }}>
          <i className="fas fa-wifi" style={{ fontSize: 24, color: "#fff" }} />
        </div>
        <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Tomihonk Internet</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", margin: "4px 0 0", fontSize: ".9rem" }}>Form Penilaian Pelanggan</p>
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 20, padding: "28px 28px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* ── Loading ── */}
        {stage === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6c757d" }}>
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 32, color: "#0d6efd", marginBottom: 16, display: "block" }} />
            Memuat data laporan...
          </div>
        )}

        {/* ── Error ── */}
        {stage === "error" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: 40, color: "#dc3545", marginBottom: 16, display: "block" }} />
            <h3 style={{ color: "#dc3545", marginBottom: 8 }}>Laporan Tidak Ditemukan</h3>
            <p style={{ color: "#6c757d", fontSize: ".9rem" }}>Link ini tidak valid atau laporan sudah dihapus. Hubungi teknisi Anda.</p>
          </div>
        )}

        {/* ── Sudah diisi ── */}
        {stage === "done_already" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(25,135,84,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <i className="fas fa-check-circle" style={{ fontSize: 36, color: "#198754" }} />
            </div>
            <h3 style={{ color: "#198754", marginBottom: 8 }}>Penilaian Sudah Dikirim</h3>
            <p style={{ color: "#6c757d", fontSize: ".9rem" }}>Anda sudah mengisi penilaian untuk layanan ini. Terima kasih!</p>
            {laporan && (
              <div style={{ marginTop: 20, background: "#f8f9fa", borderRadius: 10, padding: "12px 16px", textAlign: "left", fontSize: ".85rem" }}>
                <div><span style={{ color: "#6c757d" }}>Pelanggan: </span><strong>{laporan.pel}</strong></div>
                <div><span style={{ color: "#6c757d" }}>Layanan: </span><strong>{jenisLabel[laporan.jenis] || laporan.jenis}</strong></div>
                <div><span style={{ color: "#6c757d" }}>Tanggal: </span><strong>{laporan.tgl}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* ── Form ── */}
        {stage === "form" && laporan && (
          <>
            {/* Info ringkas */}
            <div style={{ background: "linear-gradient(135deg,rgba(13,110,253,0.06),rgba(13,110,253,0.02))", border: "1px solid rgba(13,110,253,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 24 }}>
              <div style={{ fontSize: ".78rem", color: "#0d6efd", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>
                <i className="fas fa-info-circle" style={{ marginRight: 4 }} /> Informasi Layanan
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: ".85rem" }}>
                <div><span style={{ color: "#6c757d" }}>Pelanggan: </span><strong>{laporan.pel}</strong></div>
                <div><span style={{ color: "#6c757d" }}>Layanan: </span><strong>{jenisLabel[laporan.jenis] || laporan.jenis}</strong></div>
                <div><span style={{ color: "#6c757d" }}>Teknisi: </span><strong>{laporan.tekName}</strong></div>
                <div><span style={{ color: "#6c757d" }}>Tanggal: </span><strong>{laporan.tgl}</strong></div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Rating */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 12, fontSize: ".95rem", color: "#212529" }}>
                  ⭐ Penilaian Layanan <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <i key={n}
                      className="fas fa-star"
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      style={{
                        fontSize: 40, cursor: "pointer",
                        color: (hoverRating || rating) >= n ? "#f59e0b" : "#e2e8f0",
                        transition: "color .15s, transform .15s",
                        transform: (hoverRating || rating) >= n ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
                {(hoverRating || rating) > 0 && (
                  <div style={{ textAlign: "center", fontSize: ".85rem", color: "#f59e0b", fontWeight: 600 }}>
                    {starLabel[hoverRating || rating]}
                  </div>
                )}
              </div>

              {/* Saran & Kritik */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: ".95rem", color: "#212529" }}>
                  💬 Saran & Kritik <span style={{ color: "#6c757d", fontWeight: 400, fontSize: ".82rem" }}>(opsional)</span>
                </label>
                <textarea
                  value={saran}
                  onChange={(e) => setSaran(e.target.value)}
                  rows={3}
                  placeholder="Ceritakan pengalaman Anda dengan layanan kami..."
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #dee2e6", borderRadius: 10, fontSize: ".9rem", resize: "vertical", fontFamily: "inherit", outline: "none", transition: "border-color .2s" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0d6efd")}
                  onBlur={(e) => (e.target.style.borderColor = "#dee2e6")}
                />
              </div>

              {/* Tanda Tangan */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: ".95rem", color: "#212529" }}>
                  ✍️ Tanda Tangan <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <div style={{ border: "2px dashed #dee2e6", borderRadius: 12, overflow: "hidden", background: "#fafafa" }}>
                  <canvas
                    ref={canvasRef}
                    style={{ width: "100%", height: 140, display: "block", touchAction: "none", cursor: "crosshair" }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontSize: ".8rem", color: "#6c757d" }}>Tanda tangani di area abu-abu di atas</span>
                  <button type="button" onClick={clearSig} style={{ background: "none", border: "1px solid #dee2e6", borderRadius: 6, padding: "4px 10px", fontSize: ".8rem", color: "#6c757d", cursor: "pointer" }}>
                    <i className="fas fa-eraser" style={{ marginRight: 4 }} />Hapus
                  </button>
                </div>
              </div>

              <button type="submit" disabled={submitting} style={{
                width: "100%", padding: "14px", border: "none", borderRadius: 12,
                background: submitting ? "#6c757d" : "linear-gradient(135deg,#0d6efd,#0056d6)",
                color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(13,110,253,0.35)", transition: "all .2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                {submitting
                  ? <><i className="fas fa-circle-notch fa-spin" /> Mengirim...</>
                  : <><i className="fas fa-paper-plane" /> Kirim Penilaian</>}
              </button>
            </form>
          </>
        )}

        {/* ── Sukses ── */}
        {stage === "success" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#198754,#20c997)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(25,135,84,0.35)" }}>
              <i className="fas fa-heart" style={{ fontSize: 32, color: "#fff" }} />
            </div>
            <h2 style={{ color: "#198754", marginBottom: 10, fontSize: "1.3rem" }}>Terima Kasih! 🎉</h2>
            <p style={{ color: "#6c757d", fontSize: ".9rem", lineHeight: 1.6 }}>
              Penilaian Anda telah berhasil dikirim.<br />
              Masukan Anda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan.
            </p>
            <div style={{ marginTop: 20, background: "linear-gradient(135deg,rgba(25,135,84,0.08),rgba(25,135,84,0.03))", border: "1px solid rgba(25,135,84,0.2)", borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ margin: 0, fontSize: ".85rem", color: "#198754", fontWeight: 600 }}>
                <i className="fas fa-star" style={{ color: "#f59e0b" }} /> {starLabel[rating]}
              </p>
            </div>
          </div>
        )}
      </div>

      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: ".75rem", marginTop: 24 }}>
        © {new Date().getFullYear()} PT. Tomihonk — Layanan Internet Berkualitas
      </p>
    </div>
  );
}
