import random
from bson import ObjectId
from config import db


def _generate_ticket_id() -> str:
    """Generate ID tiket unik dengan format TNN + 5 angka random, contoh: TNN12345."""
    while True:
        digits = "".join([str(random.randint(0, 9)) for _ in range(5)])
        ticket_id = f"TNN{digits}"
        # Pastikan ID belum ada di database
        if not Ticket.collection.find_one({"id": ticket_id}):
            return ticket_id


class Ticket:
    collection = db.tickets

    @staticmethod
    def get_all():
        data = []
        for t in Ticket.collection.find().sort("tgl", -1):
            data.append({
                "id": t.get("id", str(t["_id"])),
                "pel": t.get("pel", ""),
                "hp": t.get("hp", ""),
                "alm": t.get("alm", ""),
                "jenis": t.get("jenis", "pemasangan"),
                "mas": t.get("mas", ""),
                "pri": t.get("pri", "Sedang"),
                "st": t.get("st", "pending"),
                "tek": t.get("tek", ""),
                "tgl": t.get("tgl", ""),
                "estimasiMulai": t.get("estimasiMulai", ""),
                "estimasiSelesai": t.get("estimasiSelesai", ""),
            })
        return data

    @staticmethod
    def create(data):
        ticket_id = _generate_ticket_id()
        doc = {
            "id": ticket_id,
            "pel": data.get("pel"),
            "hp": data.get("hp", ""),
            "alm": data.get("alm"),
            "jenis": data.get("jenis", "pemasangan"),
            "mas": data.get("mas"),
            "pri": data.get("pri", "Sedang"),
            "st": "pending",
            "tek": data.get("tek", ""),
            "tgl": data.get("tgl"),
            "estimasiMulai": data.get("estimasiMulai", ""),
            "estimasiSelesai": data.get("estimasiSelesai", ""),
        }
        Ticket.collection.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def update_status(id, new_status):
        try:
            # Coba cari by field "id" (format TNN) dulu
            res = Ticket.collection.update_one(
                {"id": id},
                {"$set": {"st": new_status}}
            )
            if res.modified_count > 0:
                return True
            # Fallback: coba by ObjectId (data lama)
            res = Ticket.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"st": new_status}}
            )
            return res.modified_count > 0
        except Exception:
            return False

    @staticmethod
    def delete(id):
        try:
            # Coba cari by field "id" (format TNN) dulu
            res = Ticket.collection.delete_one({"id": id})
            if res.deleted_count > 0:
                return True
            # Fallback: coba by ObjectId (data lama)
            res = Ticket.collection.delete_one({"_id": ObjectId(id)})
            return res.deleted_count > 0
        except Exception:
            return False
