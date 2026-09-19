from bson import ObjectId
from config import db
from datetime import datetime


class Laporan:
    collection = db.laporan

    @staticmethod
    def get_all():
        data = []
        for l in Laporan.collection.find().sort("tgl", -1):
            data.append(Laporan._serialize(l))
        return data

    @staticmethod
    def get_by_teknisi(tek_id):
        data = []
        for l in Laporan.collection.find({"tek": tek_id}).sort("tgl", -1):
            data.append(Laporan._serialize(l))
        return data

    @staticmethod
    def get_by_id(id):
        try:
            l = Laporan.collection.find_one({"_id": ObjectId(id)})
            if not l:
                return None
            return Laporan._serialize(l)
        except Exception:
            return None

    @staticmethod
    def _serialize(l):
        return {
            "id": str(l["_id"]),
            "jenis": l.get("jenis", "pemasangan"),
            "tgl": l.get("tgl", ""),
            "ticketId": l.get("ticketId", ""),
            "pel": l.get("pel", ""),
            "paket": l.get("paket", ""),
            "odp": l.get("odp", ""),
            "titik": l.get("titik", ""),
            "keterangan": l.get("keterangan", ""),
            "rating": l.get("rating", 0),
            "ttd": l.get("ttd", ""),
            "tek": l.get("tek", ""),
            "tekName": l.get("tekName", ""),
            "saranKritik": l.get("saranKritik", ""),
            "fotoPemeliharaan": l.get("fotoPemeliharaan", []),
            "filePemeliharaan": l.get("filePemeliharaan", []),
            "feedbackSubmitted": l.get("feedbackSubmitted", False),
            # ── Field tambahan BERITA ACARA INSTALASI ──
            "hp": l.get("hp", ""),
            "noPelanggan": l.get("noPelanggan", ""),
            "marketing": l.get("marketing", ""),
            "serialONU": l.get("serialONU", ""),
            "macAddress": l.get("macAddress", ""),
            "panjangKabel": l.get("panjangKabel", ""),
            "redaman": l.get("redaman", ""),
            "usernamePPPoE": l.get("usernamePPPoE", ""),
            "passwordPPPoE": l.get("passwordPPPoE", ""),
            "hasilSpeedtest": l.get("hasilSpeedtest", ""),
            "statusKoneksi": l.get("statusKoneksi", "Normal"),
            "fotoInstalasi": l.get("fotoInstalasi", []),
        }

    @staticmethod
    def create(data):
        doc = {
            "jenis": data.get("jenis", "pemasangan"),
            "tgl": datetime.now().strftime("%Y-%m-%d"),
            "ticketId": data.get("ticketId", ""),
            "pel": data.get("pel", ""),
            "paket": data.get("paket", ""),
            "odp": data.get("odp", ""),
            "titik": data.get("titik", ""),
            "keterangan": data.get("keterangan", ""),
            "rating": data.get("rating", 0),
            "ttd": data.get("ttd", ""),
            "tek": data.get("tek", ""),
            "tekName": data.get("tekName", ""),
            "saranKritik": data.get("saranKritik", ""),
            "fotoPemeliharaan": data.get("fotoPemeliharaan", []),
            "filePemeliharaan": data.get("filePemeliharaan", []),
            "feedbackSubmitted": False,
            # ── Field tambahan BERITA ACARA INSTALASI ──
            "hp": data.get("hp", ""),
            "noPelanggan": data.get("noPelanggan", ""),
            "marketing": data.get("marketing", ""),
            "serialONU": data.get("serialONU", ""),
            "macAddress": data.get("macAddress", ""),
            "panjangKabel": data.get("panjangKabel", ""),
            "redaman": data.get("redaman", ""),
            "usernamePPPoE": data.get("usernamePPPoE", ""),
            "passwordPPPoE": data.get("passwordPPPoE", ""),
            "hasilSpeedtest": data.get("hasilSpeedtest", ""),
            "statusKoneksi": data.get("statusKoneksi", "Normal"),
            "fotoInstalasi": data.get("fotoInstalasi", []),
        }
        result = Laporan.collection.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def update_feedback(id, rating, saran_kritik, ttd):
        """Update laporan dengan penilaian dari pelanggan."""
        try:
            res = Laporan.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {
                    "rating": rating,
                    "saranKritik": saran_kritik,
                    "ttd": ttd,
                    "feedbackSubmitted": True,
                }}
            )
            return res.modified_count > 0
        except Exception:
            return False

    @staticmethod
    def delete(id):
        try:
            res = Laporan.collection.delete_one({"_id": ObjectId(id)})
            return res.deleted_count > 0
        except Exception:
            return False

