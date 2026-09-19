from bson import ObjectId
from config import db
from datetime import datetime

INITIAL_ODP = [
    {
        "kode": "ODP-TLG-001",
        "wilayah": "Talang",
        "alamat": "Jl. Projosumarto I RT 02/RW 01, Desa Kaligayam",
        "koordinat": "-6.914744, 109.135622",
        "kapasitas": 16,
        "terpakai": 6,
        "status": "tersedia",
        "keterangan": "Tiang PLN depan Masjid Baitul Muttaqin",
        "createdAt": "2025-01-10",
    },
    {
        "kode": "ODP-TLG-002",
        "wilayah": "Talang",
        "alamat": "Jl. Raya Talang No. 45, Depan Polsek Talang",
        "koordinat": "-6.921102, 109.140211",
        "kapasitas": 8,
        "terpakai": 8,
        "status": "penuh",
        "keterangan": "Tiang FO sudut pertigaan",
        "createdAt": "2025-01-12",
    },
    {
        "kode": "ODP-SLW-001",
        "wilayah": "Slawi",
        "alamat": "Jl. Jenderal Sudirman No. 88, Slawi Kulon",
        "koordinat": "-6.985610, 109.137840",
        "kapasitas": 16,
        "terpakai": 4,
        "status": "tersedia",
        "keterangan": "Dekat Alun-Alun Hanggawana Slawi",
        "createdAt": "2025-01-15",
    },
    {
        "kode": "ODP-ADW-001",
        "wilayah": "Adiwerna",
        "alamat": "Jl. Singkil No. 23, Tembok Banjaran, Adiwerna",
        "koordinat": "-6.938720, 109.124530",
        "kapasitas": 8,
        "terpakai": 3,
        "status": "tersedia",
        "keterangan": "Depan Ruko Pasar Banjaran",
        "createdAt": "2025-01-20",
    },
    {
        "kode": "ODP-DKT-001",
        "wilayah": "Dukuhturi",
        "alamat": "Jl. Raya Dukuhturi No. 15, Kupu, Dukuhturi",
        "koordinat": "-6.901230, 109.112340",
        "kapasitas": 16,
        "terpakai": 0,
        "status": "maintenance",
        "keterangan": "Dalam pengecekan splitter optik",
        "createdAt": "2025-02-01",
    },
]

class ODP:
    collection = db.odp

    @staticmethod
    def seed():
        """Seed initial ODP data if collection is empty."""
        if ODP.collection.count_documents({}) == 0:
            ODP.collection.insert_many(INITIAL_ODP)
            print("[SEED] Titik ODP created")

    @staticmethod
    def _serialize(o):
        return {
            "id": str(o["_id"]),
            "kode": o.get("kode", ""),
            "wilayah": o.get("wilayah", "Talang"),
            "alamat": o.get("alamat", ""),
            "koordinat": o.get("koordinat", ""),
            "kapasitas": int(o.get("kapasitas", 8)),
            "terpakai": int(o.get("terpakai", 0)),
            "status": o.get("status", "tersedia"),
            "keterangan": o.get("keterangan", ""),
            "createdAt": o.get("createdAt", ""),
        }

    @staticmethod
    def get_all():
        return [ODP._serialize(o) for o in ODP.collection.find()]

    @staticmethod
    def create(data):
        doc = {
            "kode": data.get("kode", "").strip().upper(),
            "wilayah": data.get("wilayah", "Talang").strip(),
            "alamat": data.get("alamat", "").strip(),
            "koordinat": data.get("koordinat", "").strip(),
            "kapasitas": int(data.get("kapasitas", 8)),
            "terpakai": int(data.get("terpakai", 0)),
            "status": data.get("status", "tersedia"),
            "keterangan": data.get("keterangan", "").strip(),
            "createdAt": data.get("createdAt") or datetime.now().strftime("%Y-%m-%d"),
        }
        # Otomatis update status jika penuh
        if doc["terpakai"] >= doc["kapasitas"] and doc["status"] == "tersedia":
            doc["status"] = "penuh"

        result = ODP.collection.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def update(id, data):
        try:
            update_data = {}
            if "kode" in data:
                update_data["kode"] = data["kode"].strip().upper()
            if "wilayah" in data:
                update_data["wilayah"] = data["wilayah"].strip()
            if "alamat" in data:
                update_data["alamat"] = data["alamat"].strip()
            if "koordinat" in data:
                update_data["koordinat"] = data["koordinat"].strip()
            if "kapasitas" in data:
                update_data["kapasitas"] = int(data["kapasitas"])
            if "terpakai" in data:
                update_data["terpakai"] = int(data["terpakai"])
            if "status" in data:
                update_data["status"] = data["status"]
            if "keterangan" in data:
                update_data["keterangan"] = data["keterangan"].strip()

            # Otomatis set status penuh jika terpakai >= kapasitas dan status sebelumnya tersedia
            if "terpakai" in update_data or "kapasitas" in update_data:
                existing = ODP.collection.find_one({"_id": ObjectId(id)})
                if existing:
                    kap = update_data.get("kapasitas", existing.get("kapasitas", 8))
                    ter = update_data.get("terpakai", existing.get("terpakai", 0))
                    st = update_data.get("status", existing.get("status", "tersedia"))
                    if ter >= kap and st == "tersedia":
                        update_data["status"] = "penuh"
                    elif ter < kap and st == "penuh":
                        update_data["status"] = "tersedia"

            if not update_data:
                return False

            res = ODP.collection.update_one({"_id": ObjectId(id)}, {"$set": update_data})
            return res.modified_count > 0 or res.matched_count > 0
        except Exception:
            return False

    @staticmethod
    def delete(id):
        try:
            res = ODP.collection.delete_one({"_id": ObjectId(id)})
            return res.deleted_count > 0
        except Exception:
            return False
