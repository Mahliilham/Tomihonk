import { useEffect, useState } from "react";
import { Modal, ModalHeader } from "@/components/Modal";
import { useApp } from "@/context/AppContext";
import type { TitikODP } from "@/lib/types";

interface Props {
  open: boolean;
  editing: TitikODP | null;
  onClose: () => void;
}

const WILAYAH_LIST = [
  "Talang",
  "Slawi",
  "Adiwerna",
  "Dukuhturi",
  "Tarub",
  "Kramat",
  "Suradadi",
  "Warureja",
  "Pangkah",
  "Jatinegara",
  "Lebaksiu",
  "Balapulang",
  "BumiJawa",
  "Bojong",
  "Margasari",
  "Pagerbarang",
  "Dukuwaru",
  "Kedungbanteng",
];

const DEFAULT_FORM: Omit<TitikODP, "id"> = {
  kode: "",
  wilayah: "Talang",
  alamat: "",
  koordinat: "",
  kapasitas: 16,
  terpakai: 0,
  status: "tersedia",
  keterangan: "",
};

export default function ODPModal({ open, editing, onClose }: Props) {
  const { saveODP } = useApp();
  const [form, setForm] = useState<Omit<TitikODP, "id">>(DEFAULT_FORM);
  const [customWilayah, setCustomWilayah] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        kode: editing.kode || "",
        wilayah: editing.wilayah || "Talang",
        alamat: editing.alamat || "",
        koordinat: editing.koordinat || "",
        kapasitas: editing.kapasitas ?? 16,
        terpakai: editing.terpakai ?? 0,
        status: editing.status || "tersedia",
        keterangan: editing.keterangan || "",
      });
      setCustomWilayah(!WILAYAH_LIST.includes(editing.wilayah));
    } else {
      setForm(DEFAULT_FORM);
      setCustomWilayah(false);
    }
  }, [editing, open]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((p) => {
      const next = { ...p, [k]: v };
      // Otomatis update status jika terpakai >= kapasitas
      if (k === "terpakai" || k === "kapasitas") {
        const ter = k === "terpakai" ? (v as number) : p.terpakai;
        const kap = k === "kapasitas" ? (v as number) : p.kapasitas;
        if (ter >= kap && p.status === "tersedia") {
          next.status = "penuh";
        } else if (ter < kap && p.status === "penuh") {
          next.status = "tersedia";
        }
      }
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kode.trim() || !form.alamat.trim()) return;

    await saveODP({
      ...(editing ? { id: editing.id } : {}),
      ...form,
      kapasitas: Number(form.kapasitas),
      terpakai: Number(form.terpakai),
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        icon="fa-network-wired"
        title={editing ? "Edit Titik ODP" : "Tambah Titik ODP Baru"}
        subtitle="Kelola data lokasi Optical Distribution Point (ODP) jaringan fiber"
        onClose={onClose}
      />
      <div className="modal-body">
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label>Kode ODP *</label>
              <input
                className="form-control"
                required
                placeholder="Contoh: ODP-TLG-001"
                value={form.kode}
                onChange={(e) => set("kode", e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group">
              <label>Wilayah / Kecamatan *</label>
              {!customWilayah ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <select
                    className="form-control"
                    value={form.wilayah}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setCustomWilayah(true);
                        set("wilayah", "");
                      } else {
                        set("wilayah", e.target.value);
                      }
                    }}
                  >
                    {WILAYAH_LIST.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                    <option value="__custom__">+ Lainnya (Ketik Manual)</option>
                  </select>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    className="form-control"
                    required
                    placeholder="Nama Wilayah / Kecamatan"
                    value={form.wilayah}
                    onChange={(e) => set("wilayah", e.target.value)}
                  />
                  <button
                    type="button"
                    className="th-btn th-btn-outline th-btn-sm"
                    onClick={() => {
                      setCustomWilayah(false);
                      set("wilayah", "Talang");
                    }}
                    title="Pilih dari daftar"
                  >
                    <i className="fas fa-list" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Alamat / Lokasi Pemasangan *</label>
            <textarea
              className="form-control"
              required
              rows={2}
              placeholder="Contoh: Jl. Projosumarto I RT 02/RW 01, Desa Kaligayam"
              value={form.alamat}
              onChange={(e) => set("alamat", e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
            <div className="form-group">
              <label>
                Koordinat GPS (Latitude, Longitude){" "}
                {form.koordinat && (
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(form.koordinat)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: ".78rem", color: "#3b82f6", marginLeft: 6 }}
                  >
                    <i className="fas fa-external-link-alt" /> Tes di Maps
                  </a>
                )}
              </label>
              <input
                className="form-control"
                placeholder="Contoh: -6.914744, 109.135622"
                value={form.koordinat || ""}
                onChange={(e) => set("koordinat", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Status ODP *</label>
              <select
                className="form-control"
                value={form.status}
                onChange={(e) => set("status", e.target.value as TitikODP["status"])}
              >
                <option value="tersedia">Tersedia (Port Kosong)</option>
                <option value="penuh">Penuh (Semua Port Terpakai)</option>
                <option value="maintenance">Maintenance / Perbaikan</option>
                <option value="rusak">Rusak / Tidak Aktif</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label>Kapasitas Total Port *</label>
              <select
                className="form-control"
                value={form.kapasitas}
                onChange={(e) => set("kapasitas", Number(e.target.value))}
              >
                <option value={4}>4 Port</option>
                <option value={8}>8 Port</option>
                <option value={16}>16 Port</option>
                <option value={24}>24 Port</option>
                <option value={32}>32 Port</option>
                <option value={48}>48 Port</option>
                <option value={64}>64 Port</option>
              </select>
            </div>

            <div className="form-group">
              <label>Port Terpakai *</label>
              <input
                type="number"
                min={0}
                max={form.kapasitas}
                className="form-control"
                required
                value={form.terpakai}
                onChange={(e) => set("terpakai", Number(e.target.value))}
              />
              <small style={{ color: "#64748b", marginTop: 4, display: "block" }}>
                Sisa Port: <strong>{Math.max(0, form.kapasitas - form.terpakai)} Port</strong>
              </small>
            </div>
          </div>

          <div className="form-group">
            <label>Keterangan / Posisi Fisik</label>
            <input
              className="form-control"
              placeholder="Contoh: Tiang PLN depan Masjid Baitul Muttaqin / Di tiang sudut pertigaan"
              value={form.keterangan || ""}
              onChange={(e) => set("keterangan", e.target.value)}
            />
          </div>

          <button type="submit" className="th-btn th-btn-primary" style={{ width: "100%", marginTop: 8 }}>
            <i className={`fas ${editing ? "fa-save" : "fa-plus"}`} /> {editing ? "Simpan Perubahan" : "Tambahkan Titik ODP"}
          </button>
        </form>
      </div>
    </Modal>
  );
}
