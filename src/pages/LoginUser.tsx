import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import logo from "../assets/logo.png";

export default function LoginUser() {
  const { login, currentUser } = useApp();
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Jika sudah login, redirect ke beranda / dashboard
  useEffect(() => {
    if (currentUser) navigate("/", { replace: true });
  }, [currentUser, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const ok = await login(u, p, "user");
      if (ok) {
        navigate("/");
      } else {
        setError("Username atau password salah.");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPaket = sessionStorage.getItem("selected_paket");

  return (
    <div className="login-page">
      <div className="login-bg-overlay" />
      <div className="login-card">
        <div className="login-logo-wrap">
          <img src={logo} alt="Tomihonk" className="login-logo" />
        </div>
        <div className="login-header">
          <span
            style={{
              background: "rgba(249,115,22,0.12)",
              color: "var(--th-accent, #f97316)",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: ".78rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <i className="fas fa-users" /> Portal Pelanggan
          </span>
          <h1>Login Pelanggan</h1>
          <p>Masuk untuk cek tagihan, status layanan, dan tiket internet</p>

          {selectedPaket && (
            <div
              style={{
                marginTop: 12,
                background: "#fff7ed",
                border: "1px solid #fdba74",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: ".84rem",
                color: "#9a3412",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <i className="fas fa-tag" style={{ color: "#ea580c" }} />
              <div>
                Paket yang dipilih: <strong>{selectedPaket}</strong>. Silakan login atau daftar akun untuk melanjutkan pemasangan.
              </div>
            </div>
          )}
        </div>
        <form onSubmit={submit} className="login-form">
          <div className="login-field">
            <label htmlFor="user-username">
              <i className="fas fa-user" /> Username
            </label>
            <input
              id="user-username"
              className="login-input"
              required
              maxLength={50}
              value={u}
              onChange={(e) => setU(e.target.value)}
              placeholder="Masukkan username Anda"
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="user-password">
              <i className="fas fa-lock" /> Password
            </label>
            <div className="login-input-wrap">
              <input
                id="user-password"
                type={showPassword ? "text" : "password"}
                className="login-input"
                required
                maxLength={50}
                value={p}
                onChange={(e) => setP(e.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <i className="fas fa-exclamation-circle" /> {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Memverifikasi...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt" /> Masuk sebagai Pelanggan
              </>
            )}
          </button>
        </form>

        <button
          className="login-back"
          onClick={() => navigate("/register")}
          style={{ marginTop: 14, color: "var(--th-accent, #f97316)", fontWeight: 700 }}
        >
          <i className="fas fa-user-plus" /> Belum punya akun? Daftar di sini
        </button>

        <div style={{ borderTop: "1px solid #f1f5f9", margin: "14px 0 8px" }} />

        {/* <button
          className="login-back"
          onClick={() => navigate("/login")}
          style={{ color: "#64748b", fontSize: ".82rem" }}
        >
          <i className="fas fa-user-shield" /> Login sebagai Staff / Admin
        </button> */}

        <button
          className="login-back"
          onClick={() => navigate("/")}
          style={{ fontSize: ".82rem" }}
        >
          <i className="fas fa-arrow-left" /> Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
