import { useState } from "react";
import { Modal, ModalHeader } from "@/components/Modal";
import { useApp } from "@/context/AppContext";
import type { Role } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: Props) {
  const { login } = useApp();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [role, setRole] = useState<Role>("admin");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await login(u, p, role);
      if (ok) {
        setU("");
        setP("");
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader
        icon="fa-user-shield"
        title="Login Akun"
        subtitle="Masuk untuk mengakses dashboard Anda"
        onClose={onClose}
      />
      <div className="modal-body">
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Username</label>
            <input
              className="form-control"
              required
              maxLength={50}
              value={u}
              onChange={(e) => setU(e.target.value)}
              placeholder="Masukkan username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                required
                maxLength={50}
                value={p}
                onChange={(e) => setP(e.target.value)}
                placeholder="Masukkan password"
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Login Sebagai</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              required
            >
              <option value="user">Pelanggan / User</option>
              <option value="admin">Admin</option>
              <option value="teknisi">Teknisi</option>
              <option value="sales">Sales</option>
            </select>
          </div>
          <button type="submit" className="th-btn th-btn-primary" style={{ width: "100%" }} disabled={loading}>
            <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-sign-in-alt"}`} /> {loading ? "Memverifikasi..." : "Login"}
          </button>
          {/* <div className="demo-info">
            <strong>Akun Demo:</strong>
            <br />
            Admin: <code>admin</code> / <code>admin123</code>
            <br />
            Teknisi: <code>rudi</code> / <code>rudi123</code>
            <br />
            Sales: <code>dewi</code> / <code>dewi123</code>
          </div> */}
        </form>
      </div>
    </Modal>
  );
}
