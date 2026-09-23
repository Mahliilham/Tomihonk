from bson import ObjectId
from config import db
from datetime import datetime, timezone


class Notification:
    collection = db.notifications

    @staticmethod
    def _serialize(doc):
        return {
            "id": str(doc["_id"]),
            "target": doc.get("target", "admin"),
            "title": doc.get("title", ""),
            "desc": doc.get("desc", ""),
            "read": doc.get("read", False),
            "time": doc.get("time", 0),
        }

    @staticmethod
    def get_by_target(target: str):
        """Ambil semua notifikasi untuk target tertentu, urut terbaru dulu."""
        docs = Notification.collection.find(
            {"target": target}
        ).sort("time", -1).limit(100)
        return [Notification._serialize(d) for d in docs]

    @staticmethod
    def create(target: str, title: str, desc: str):
        """Buat notifikasi baru."""
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        doc = {
            "target": target,
            "title": title,
            "desc": desc,
            "read": False,
            "time": now_ms,
        }
        result = Notification.collection.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def mark_read(id: str) -> bool:
        """Tandai satu notifikasi sebagai sudah dibaca."""
        try:
            res = Notification.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"read": True}}
            )
            return res.modified_count > 0
        except Exception:
            return False

    @staticmethod
    def mark_all_read(target: str) -> int:
        """Tandai semua notifikasi target sebagai sudah dibaca."""
        res = Notification.collection.update_many(
            {"target": target, "read": False},
            {"$set": {"read": True}}
        )
        return res.modified_count

    @staticmethod
    def delete_old(days: int = 30):
        """Hapus notifikasi yang sudah lebih dari N hari (opsional, untuk kebersihan data)."""
        cutoff_ms = int(
            (datetime.now(timezone.utc).timestamp() - days * 86400) * 1000
        )
        res = Notification.collection.delete_many({"time": {"$lt": cutoff_ms}})
        return res.deleted_count
