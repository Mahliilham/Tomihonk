import { useEffect, useState } from "react";
import { useFormDraft } from "@/hooks/useFormDraft";
import { Modal, ModalHeader } from "@/components/Modal";
import { useApp } from "@/context/AppContext";
import type { Paket } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Paket | null;
}

const empty = { nama: "", speed: 0, harga: 0, kat: "Home", desc: "" };

export default function PaketModal({ open, onClose, editing }: Props) {
  const { savePaket } = useApp();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editing) setForm({ nama: editing.nama, speed: editing.speed, harga: editing.harga, kat: editing.kat, desc: editing.desc });
    else setForm(empty);
  }, [editing, open]);

  // ── Draft: simpan & pulihkan form jika modal ditutup tidak sengaja (hanya saat buat baru) ──
  const { clearDraft } = useFormDraft("draft_paket", form, setForm, open && !editing);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    savePaket({ ...form, id: editing?.id });
    clearDraft();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader
        icon="fa-box"
        title={editing ? "Edit Paket" : "Tambah Paket"}
        subtitle="Kelola paket layanan internet"
        onClose={onClose}
      />
      <div className="modal-body">
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Nama Paket *</label>
            <input className="form-control" required maxLength={80} value={form.nama}
              onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Kategori *</label>
            <select className="form-control" value={form.kat}
              onChange={(e) => setForm((p) => ({ ...p, kat: e.target.value }))}>
              <option value="Home">Home</option>
              <option value="Gamers">Gamers</option>
            </select>
          </div>
          <div className="form-group">
            <label>Kecepatan (Mbps) *</label>
            <input type="number" min={1} className="form-control" required value={form.speed || ""}
              onChange={(e) => setForm((p) => ({ ...p, speed: Number(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label>Harga (Rp) *</label>
            <input type="number" min={0} className="form-control" required value={form.harga || ""}
              onChange={(e) => setForm((p) => ({ ...p, harga: Number(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label>Deskripsi</label>
            <textarea className="form-control" maxLength={200} value={form.desc}
              onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))} />
          </div>
          <button type="submit" className="th-btn th-btn-primary" style={{ width: "100%" }}>
            <i className="fas fa-save" /> Simpan
          </button>
        </form>
      </div>
    </Modal>
  );
}
