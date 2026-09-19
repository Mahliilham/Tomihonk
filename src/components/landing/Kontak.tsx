import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";

type Step = "input" | "otp" | "form" | "sukses";

interface VerifiedUser {
  nama: string;
  hp: string;
}

export default function Kontak() {
  const { addKeluhan } = useApp();

  // â”€â”€ State utama â”€â”€
  const [step, setStep] = useState<Step>("input");
  const [inputForm, setInputForm] = useState({ nama: "", hp: "" });
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [kForm, setKForm] = useState({ email: "", pesan: "" });
  const [verified, setVerified] = useState<VerifiedUser | null>(null);
  const [hpMasked, setHpMasked] = useState("");

  // â”€â”€ Loading & error â”€â”€
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // â”€â”€ Cooldown kirim ulang OTP â”€â”€
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // â”€â”€ OTP input refs untuk auto-focus â”€â”€
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startCooldown = (sec = 60) => {
    setCooldown(sec);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // â”€â”€ Step 1: Kirim OTP â”€â”€
  const handleKirimOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verifikasi/kirim-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: inputForm.nama, hp: inputForm.hp }),
      });
      const result = await res.json();
      if (res.ok) {
        setHpMasked(result.hp_masked);
        setStep("otp");
        setOtpDigits(["", "", "", "", "", ""]);
        startCooldown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(result.error || "Gagal mengirim OTP.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ Step 2: Verifikasi OTP â”€â”€
  const handleVerifikasiOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Masukkan 6 digit kode OTP"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verifikasi/verifikasi-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hp: inputForm.hp, otp }),
      });
      const result = await res.json();
      if (res.ok && result.valid) {
        setVerified({ nama: result.nama, hp: result.hp });
        setStep("form");
      } else {
        setError(result.error || "Kode OTP salah.");
        // Shake effect â€” reset input
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ OTP digit input handler â”€â”€
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val.slice(-1);
    setOtpDigits(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    // Auto-submit jika sudah 6 digit
    if (next.every(d => d) && val) {
      setTimeout(() => {
        const form = document.getElementById("otp-form") as HTMLFormElement;
        form?.requestSubmit();
      }, 100);
    }
  };
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtpDigits(paste.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // â”€â”€ Step 3: Kirim keluhan â”€â”€
  const handleSubmitKeluhan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) return;
    addKeluhan({
      nama: verified.nama.slice(0, 100),
      email: kForm.email.slice(0, 255),
      hp: verified.hp.slice(0, 20),
      pesan: kForm.pesan.slice(0, 1000),
    });
    setStep("sukses");
  };

  // â”€â”€ Reset â”€â”€
  const handleReset = () => {
    setStep("input");
    setInputForm({ nama: "", hp: "" });
    setOtpDigits(["", "", "", "", "", ""]);
    setKForm({ email: "", pesan: "" });
    setVerified(null);
    setHpMasked("");
    setError("");
    setCooldown(0);
  };

  // â”€â”€ Kirim ulang OTP â”€â”€
  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verifikasi/kirim-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: inputForm.nama, hp: inputForm.hp }),
      });
      const result = await res.json();
      if (res.ok) {
        setOtpDigits(["", "", "", "", "", ""]);
        startCooldown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(result.error || "Gagal kirim ulang.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ Style helpers â”€â”€
  const stepActive = (s: Step) => step === s || (step === "sukses" && s === "form");
  const stepDone = (s: Step) => {
    const order: Step[] = ["input", "otp", "form", "sukses"];
    return order.indexOf(step) > order.indexOf(s);
  };
  const STEPS = [
    { k: "input" as Step, label: "Identitas", icon: "fa-user" },
    { k: "otp" as Step, label: "Kode OTP", icon: "fa-key" },
    { k: "form" as Step, label: "Keluhan", icon: "fa-comment-dots" },
  ];

  return (
    <section id="kontak" className="th-section">
      <div className="th-container">
        <div className="section-title">
          <span className="eyebrow">Kontak</span>
          <h2>Mari <span>Terhubung</span> dengan Kami</h2>
          <p>Kami siap melayani pertanyaan dan kebutuhan Anda</p>
        </div>
        <div className="contact-grid">

          {/* â”€â”€ Info Kontak â”€â”€ */}
          <div className="contact-info">
            <h3>Informasi Kontak</h3>
            <p>Jangan ragu untuk menghubungi kami melalui kanal berikut:</p>
            {[
              { i: "fa-map-marker-alt", t: "Alamat Kantor", d: "Jl. Projosumarto I Desa Kaligayam Kec. Talang Kab. Tegal 52193" },
              { i: "fa-phone", t: "Telepon", d: "+62 851-3822-2298" },
              { i: "fa-envelope", t: "Email", d: "pt.tomihonknetworknusantara@tomihonk.co.id" },
              { i: "fab fa-whatsapp", t: "WhatsApp", d: "+62 851-3822-2298" },
              { i: "fa-clock", t: "Jam Operasional", d: "Senin - Minggu: 08.30 - 16.00 WIB" },
            ].map((it) => (
              <div key={it.t} className="info-item">
                <div className="ic">
                  <i className={it.i.startsWith("fab") ? it.i : `fas ${it.i}`} />
                </div>
                <div><h5>{it.t}</h5><p>{it.d}</p></div>
              </div>
            ))}
            <div className="socials">
              {["facebook-f", "instagram", "twitter", "youtube", "linkedin-in"].map((s) => (
                <a key={s} href="#"><i className={`fab fa-${s}`} /></a>
              ))}
            </div>
          </div>

          {/* â”€â”€ Form Keluhan â”€â”€ */}
          <div className="contact-form">
            <h3>Kirim Keluhan / Pesan</h3>

            {/* Step indicator */}
            {step !== "sukses" && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: 22, marginTop: 6 }}>
                {STEPS.map((s, i) => (
                  <div key={s.k} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: ".9rem",
                        background: stepDone(s.k) ? "var(--th-success,#198754)" : stepActive(s.k) ? "var(--th-primary,#0057B7)" : "var(--th-border,#dee2e6)",
                        color: (stepDone(s.k) || stepActive(s.k)) ? "#fff" : "var(--th-muted,#6c757d)",
                        transition: "all .3s",
                        boxShadow: stepActive(s.k) ? "0 0 0 4px rgba(0,87,183,0.15)" : "none",
                      }}>
                        {stepDone(s.k) ? <i className="fas fa-check" /> : <i className={`fas ${s.icon}`} style={{ fontSize: ".8rem" }} />}
                      </div>
                      <span style={{ fontSize: ".7rem", fontWeight: stepActive(s.k) ? 600 : 400, color: stepActive(s.k) ? "var(--th-primary)" : "var(--th-muted,#6c757d)", whiteSpace: "nowrap" }}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        flex: 1, height: 2, margin: "0 6px", marginBottom: 18,
                        background: stepDone(s.k) ? "var(--th-success,#198754)" : "var(--th-border,#dee2e6)",
                        transition: "background .3s",
                      }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div style={{
                background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.25)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 14,
                color: "#dc3545", fontSize: ".86rem", display: "flex", gap: 8, alignItems: "flex-start",
              }}>
                <i className="fas fa-exclamation-circle" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* â•â•â•â• STEP 1: Input nama & HP â•â•â•â• */}
            {step === "input" && (
              <form onSubmit={handleKirimOtp}>
                <p style={{ color: "var(--th-muted)", fontSize: ".87rem", marginBottom: 16, lineHeight: 1.6 }}>
                  <i className="fab fa-whatsapp" style={{ color: "#25d366", marginRight: 6 }} />
                  Masukkan nama dan nomor HP aktif â€” kode OTP akan dikirim ke <strong>WhatsApp</strong> Anda.
                </p>
                <div className="form-group">
                  <label>Nama Lengkap *</label>
                  <input className="form-control" required maxLength={100}
                    value={inputForm.nama} disabled={loading}
                    onChange={(e) => setInputForm((p) => ({ ...p, nama: e.target.value }))}
                    placeholder="Masukkan nama Anda" />
                </div>
                <div className="form-group">
                  <label>Nomor WhatsApp Aktif *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      color: "#25d366", fontSize: ".9rem",
                    }}>
                      <i className="fab fa-whatsapp" />
                    </span>
                    <input type="tel" className="form-control" required maxLength={20}
                      value={inputForm.hp} disabled={loading}
                      onChange={(e) => setInputForm((p) => ({ ...p, hp: e.target.value }))}
                      placeholder="08xxxxxxxxxx"
                      style={{ paddingLeft: 36 }} />
                  </div>
                </div>
                <button type="submit" className="th-btn th-btn-primary" style={{ width: "100%" }} disabled={loading}>
                  {loading
                    ? <><i className="fas fa-spinner fa-spin" /> Mengirim OTP...</>
                    : <><i className="fas fa-paper-plane" /> Kirim Kode OTP</>}
                </button>
              </form>
            )}

            {/* â•â•â•â• STEP 2: Input OTP â•â•â•â• */}
            {step === "otp" && (
              <form id="otp-form" onSubmit={handleVerifikasiOtp}>
                <div style={{
                  background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.3)",
                  borderRadius: 10, padding: "14px 16px", marginBottom: 18, textAlign: "center",
                }}>
                  <i className="fab fa-whatsapp" style={{ color: "#25d366", fontSize: "1.4rem", display: "block", marginBottom: 6 }} />
                  <p style={{ margin: 0, fontSize: ".87rem", color: "var(--th-text)" }}>
                    Kode OTP dikirim ke WhatsApp<br />
                    <strong style={{ fontSize: "1rem" }}>{hpMasked}</strong>
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: ".78rem", color: "var(--th-muted)" }}>
                    Berlaku selama <strong>5 menit</strong>
                  </p>
                </div>

                {/* OTP digit boxes */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }} onPaste={handleOtpPaste}>
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={loading}
                      style={{
                        width: 46, height: 54, textAlign: "center", fontSize: "1.4rem", fontWeight: 700,
                        border: `2px solid ${d ? "var(--th-primary,#0057B7)" : "var(--th-border,#dee2e6)"}`,
                        borderRadius: 10, outline: "none", transition: "border .2s",
                        background: "var(--th-surface,#fff)", color: "var(--th-text,#212529)",
                      }}
                    />
                  ))}
                </div>

                <button type="submit" className="th-btn th-btn-primary" style={{ width: "100%", marginBottom: 12 }} disabled={loading}>
                  {loading
                    ? <><i className="fas fa-spinner fa-spin" /> Memverifikasi...</>
                    : <><i className="fas fa-check-circle" /> Verifikasi OTP</>}
                </button>

                <div style={{ textAlign: "center", fontSize: ".84rem", color: "var(--th-muted)" }}>
                  Tidak menerima kode?{" "}
                  {cooldown > 0
                    ? <span>Kirim ulang dalam <strong>{cooldown}s</strong></span>
                    : <button type="button" onClick={handleResend} disabled={loading}
                        style={{ background: "none", border: "none", color: "var(--th-primary)", cursor: "pointer", fontWeight: 600, padding: 0, fontSize: ".84rem" }}>
                        Kirim Ulang
                      </button>
                  }
                </div>
                <div style={{ textAlign: "center", marginTop: 10 }}>
                  <button type="button" onClick={() => { setStep("input"); setError(""); }}
                    style={{ background: "none", border: "none", color: "var(--th-muted)", cursor: "pointer", fontSize: ".82rem" }}>
                    <i className="fas fa-arrow-left" /> Ganti nomor
                  </button>
                </div>
              </form>
            )}

            {/* â•â•â•â• STEP 3: Form Keluhan â•â•â•â• */}
            {step === "form" && verified && (
              <form onSubmit={handleSubmitKeluhan}>
                <div style={{
                  background: "rgba(0,87,183,0.05)", border: "1px solid rgba(0,87,183,0.15)",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                  fontSize: ".85rem", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", background: "var(--th-primary,#0057B7)",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {verified.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--th-text)" }}>{verified.nama}</div>
                    <div style={{ color: "var(--th-muted)", fontSize: ".8rem" }}>
                      <i className="fas fa-check-circle" style={{ color: "#198754", marginRight: 4 }} />
                      Terverifikasi via WhatsApp
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input className="form-control" value={verified.nama} readOnly
                    style={{ background: "var(--th-bg,#f8f9fa)", cursor: "not-allowed", color: "var(--th-muted)" }} />
                </div>
                <div className="form-group">
                  <label>Email <span style={{ fontSize: ".8rem", color: "var(--th-muted)", fontWeight: 400 }}>(opsional)</span></label>
                  <input type="email" className="form-control" maxLength={255}
                    value={kForm.email} onChange={(e) => setKForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@contoh.com" />
                </div>
                <div className="form-group">
                  <label>No. HP</label>
                  <input type="tel" className="form-control" value={verified.hp} readOnly
                    style={{ background: "var(--th-bg,#f8f9fa)", cursor: "not-allowed", color: "var(--th-muted)" }} />
                </div>
                <div className="form-group">
                  <label>Pesan / Keluhan *</label>
                  <textarea className="form-control" required rows={4} maxLength={1000}
                    value={kForm.pesan} onChange={(e) => setKForm((p) => ({ ...p, pesan: e.target.value }))}
                    placeholder="Ceritakan keluhan atau masukan Anda secara detail..." />
                  <small style={{ color: "var(--th-muted)", fontSize: ".78rem" }}>{kForm.pesan.length}/1000</small>
                </div>
                <button type="submit" className="th-btn th-btn-primary" style={{ width: "100%" }}>
                  <i className="fas fa-paper-plane" /> Kirim Keluhan
                </button>
              </form>
            )}

            {/* â•â•â•â• SUKSES â•â•â•â• */}
            {step === "sukses" && (
              <div style={{ textAlign: "center", padding: "28px 16px" }}>
                <div style={{
                  width: 76, height: 76, borderRadius: "50%",
                  background: "rgba(25,135,84,0.1)", margin: "0 auto 16px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <i className="fas fa-check-circle" style={{ fontSize: "2.4rem", color: "#198754" }} />
                </div>
                <h4 style={{ marginBottom: 8 }}>Keluhan Terkirim!</h4>
                <p style={{ color: "var(--th-muted)", fontSize: ".9rem", marginBottom: 24 }}>
                  Terima kasih, <strong>{verified?.nama}</strong>!<br />
                  Tim kami akan segera menindaklanjuti keluhan Anda.
                </p>
                <button className="th-btn th-btn-outline" onClick={handleReset}>
                  <i className="fas fa-redo" /> Kirim Keluhan Lain
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

