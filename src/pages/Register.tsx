import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import logo from "../assets/logo.png";

export default function Register() {
  const { registerUser, login } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    hp: "",
    alamat: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedPaket = sessionStorage.getItem("selected_paket");

  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      const ok = await registerUser({
        username: form.username,
        password: form.password,
        name: form.name,
        email: form.email,
        hp: form.hp,
        alamat: form.alamat,
      });
      if (ok) {
        // Otomatis login akun baru
        const loginOk = await login(form.username, form.password, "user");
        sessionStorage.setItem("auto_open_calon", "true");
        if (loginOk) {
          navigate("/");
        } else {
          navigate("/login-pelanggan");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-overlay" />
      <div className="login-card" style={{ maxWidth: 460 }}>
        <div className="login-logo-wrap">
          <img src={logo} alt="Tomihonk" className="login-logo" />
        </div>
        <div className="login-header">
          <h1>Daftar Akun</h1>
          <p>Buat akun baru untuk mulai menggunakan layanan</p>

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
              <i className="fas fa-info-circle" style={{ color: "#ea580c" }} />
              <div>
                Pendaftaran untuk <strong>{selectedPaket}</strong>. Setelah akun dibuat, Anda akan langsung mengisi data pemasangan.
              </div>
            </div>
          )}
        </div>
        <form onSubmit={submit} className="login-form">
          <div className="login-field">
            <label htmlFor="reg-name">
              <i className="fas fa-user" /> Nama Lengkap
            </label>
            <input
              id="reg-name"
              className="login-input"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="login-field">
            <label htmlFor="reg-username">
              <i className="fas fa-at" /> Username
            </label>
            <input
              id="reg-username"
              className="login-input"
              required
              maxLength={50}
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="Masukkan username"
              autoComplete="username"
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="login-field" style={{ flex: 1 }}>
              <label htmlFor="reg-email">
                <i className="fas fa-envelope" /> Email
              </label>
              <input
                id="reg-email"
                type="email"
                className="login-input"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@contoh.com"
              />
            </div>
            <div className="login-field" style={{ flex: 1 }}>
              <label htmlFor="reg-hp">
                <i className="fas fa-phone" /> No. HP
              </label>
              <input
                id="reg-hp"
                className="login-input"
                value={form.hp}
                onChange={(e) => set("hp", e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="reg-alamat">
              <i className="fas fa-map-marker-alt" /> Alamat
            </label>
            <input
              id="reg-alamat"
              className="login-input"
              value={form.alamat}
              onChange={(e) => set("alamat", e.target.value)}
              placeholder="Masukkan alamat lengkap"
            />
          </div>

          <div className="login-field">
            <label htmlFor="reg-password">
              <i className="fas fa-lock" /> Password
            </label>
            <div className="login-input-wrap">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                className="login-input"
                required
                minLength={6}
                maxLength={50}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
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

          <div className="login-field">
            <label htmlFor="reg-confirm">
              <i className="fas fa-lock" /> Konfirmasi Password
            </label>
            <div className="login-input-wrap">
              <input
                id="reg-confirm"
                type={showPassword ? "text" : "password"}
                className="login-input"
                required
                minLength={6}
                maxLength={50}
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="Ulangi password"
                autoComplete="new-password"
              />
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
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Mendaftarkan...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus" /> Daftar
              </>
            )}
          </button>
        </form>

        <button
          className="login-back"
          onClick={() => navigate("/login-pelanggan")}
          style={{ marginTop: 8 }}
        >
          <i className="fas fa-sign-in-alt" /> Sudah punya akun? Login di sini
        </button>

        <button
          className="login-back"
          onClick={() => navigate("/")}
        >
          <i className="fas fa-arrow-left" /> Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
