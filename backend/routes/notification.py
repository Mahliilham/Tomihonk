from flask import Blueprint, request, jsonify
from models.notification import Notification

notification_bp = Blueprint("notification", __name__)


@notification_bp.route("", methods=["GET"])
def get_notifications():
    """GET /api/notifications?target=admin — Ambil notifikasi berdasarkan target."""
    target = request.args.get("target", "admin")
    if target not in ("admin", "tech", "sales"):
        return jsonify({"error": "Target tidak valid. Pilihan: admin, tech, sales"}), 400
    docs = Notification.get_by_target(target)
    return jsonify(docs), 200


@notification_bp.route("", methods=["POST"])
def create_notification():
    """POST /api/notifications — Buat notifikasi baru."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Data tidak boleh kosong"}), 400
    target = data.get("target", "admin")
    title = data.get("title", "")
    desc = data.get("desc", "")
    if target not in ("admin", "tech", "sales"):
        return jsonify({"error": "Target tidak valid"}), 400
    if not title:
        return jsonify({"error": "Title wajib diisi"}), 400
    doc = Notification.create(target, title, desc)
    return jsonify({"message": "Notifikasi berhasil dibuat", "data": doc}), 201


@notification_bp.route("/<id>/read", methods=["PUT"])
def mark_read(id):
    """PUT /api/notifications/<id>/read — Tandai satu notifikasi sudah dibaca."""
    ok = Notification.mark_read(id)
    if not ok:
        return jsonify({"error": "Notifikasi tidak ditemukan atau sudah dibaca"}), 404
    return jsonify({"message": "Notifikasi ditandai sudah dibaca"}), 200


@notification_bp.route("/read-all", methods=["PUT"])
def mark_all_read():
    """PUT /api/notifications/read-all?target=admin — Tandai semua notif target dibaca."""
    target = request.args.get("target", "admin")
    if target not in ("admin", "tech", "sales"):
        return jsonify({"error": "Target tidak valid"}), 400
    count = Notification.mark_all_read(target)
    return jsonify({"message": f"{count} notifikasi ditandai sudah dibaca"}), 200
