import random
from bson import ObjectId
from config import db
from datetime import datetime


def _generate_pelanggan_id() -> str:
    """Generate unique customer ID like PLG-0001."""
    while True:
        number = random.randint(1000, 9999)
        candidate = f"PLG-{number}"
        if not CustomerUser.collection.find_one({"idPelanggan": candidate}):
            return candidate


class CustomerUser:
    collection = db.customer_users

    @staticmethod
    def _serialize(u):
        return {
            "id": str(u["_id"]),
            "username": u.get("username", ""),
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "hp": u.get("hp", ""),
            "alamat": u.get("alamat", ""),
            "idPelanggan": u.get("idPelanggan"),
            "status": u.get("status", "tidak_aktif"),
            "createdAt": u.get("createdAt", ""),
        }

    @staticmethod
    def get_all():
        return [CustomerUser._serialize(u) for u in CustomerUser.collection.find()]

    @staticmethod
    def find_by_credentials(username, password):
        u = CustomerUser.collection.find_one({"username": username, "password": password})
        return CustomerUser._serialize(u) if u else None

    @staticmethod
    def find_by_id(id):
        try:
            u = CustomerUser.collection.find_one({"_id": ObjectId(id)})
            return CustomerUser._serialize(u) if u else None
        except Exception:
            return None

    @staticmethod
    def create(data):
        # Cek username sudah ada
        if CustomerUser.collection.find_one({"username": data.get("username")}):
            return None, "Username sudah digunakan"

        doc = {
            "username": data.get("username"),
            "password": data.get("password"),
            "name": data.get("name"),
            "email": data.get("email", ""),
            "hp": data.get("hp", ""),
            "alamat": data.get("alamat", ""),
            "idPelanggan": None,
            "status": "tidak_aktif",
            "createdAt": datetime.now().strftime("%Y-%m-%d"),
        }
        result = CustomerUser.collection.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        return doc, None

    @staticmethod
    def activate(id):
        """Aktifkan user dan assign ID Pelanggan."""
        try:
            existing = CustomerUser.collection.find_one({"_id": ObjectId(id)})
            if not existing:
                return False, "User tidak ditemukan"

            id_pelanggan = existing.get("idPelanggan")
            if not id_pelanggan:
                id_pelanggan = _generate_pelanggan_id()

            res = CustomerUser.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"status": "aktif", "idPelanggan": id_pelanggan}},
            )
            return res.modified_count > 0 or existing.get("status") == "aktif", None
        except Exception as e:
            return False, str(e)

    @staticmethod
    def deactivate(id):
        """Nonaktifkan user (ID Pelanggan tetap tersimpan)."""
        try:
            res = CustomerUser.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"status": "tidak_aktif"}},
            )
            return res.modified_count > 0
        except Exception:
            return False

    @staticmethod
    def delete(id):
        try:
            res = CustomerUser.collection.delete_one({"_id": ObjectId(id)})
            return res.deleted_count > 0
        except Exception:
            return False
