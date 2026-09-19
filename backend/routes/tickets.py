from flask import Blueprint, request, jsonify
from models.ticket import Ticket

tickets_bp = Blueprint("tickets", __name__)


@tickets_bp.route("", methods=["GET"])
def get_all():
    """List semua tiket."""
    return jsonify(Ticket.get_all()), 200


@tickets_bp.route("", methods=["POST"])
def create():
    """Buat tiket baru."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body kosong"}), 400

    required = ["pel", "alm", "mas", "tek"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Field '{field}' wajib diisi"}), 400

    # ── Cek apakah teknisi yang dipilih sedang punya tiket aktif ──
    tek_id = data["tek"]
    active_ticket = Ticket.collection.find_one({
        "tek": tek_id,
        "st": {"$in": ["pending", "proses"]}
    })
    if active_ticket:
        return jsonify({
            "error": f"Teknisi '{tek_id}' sedang memiliki tugas aktif (tiket {active_ticket.get('id', '-')}). "
                     f"Selesaikan tiket tersebut terlebih dahulu sebelum menugaskan tugas baru."
        }), 409

    from datetime import date
    data["tgl"] = data.get("tgl") or date.today().isoformat()

    doc = Ticket.create(data)
    return jsonify({"message": "Tiket berhasil dibuat", "data": doc}), 201


@tickets_bp.route("/<id>/status", methods=["PUT"])
def update_status(id):
    """Update status tiket (pending → proses → selesai)."""
    data = request.get_json()
    if not data or not data.get("st"):
        return jsonify({"error": "Field 'st' wajib diisi"}), 400

    allowed = ["pending", "proses", "selesai"]
    if data["st"] not in allowed:
        return jsonify({"error": f"Status harus salah satu dari: {allowed}"}), 400

    if not Ticket.update_status(id, data["st"]):
        return jsonify({"error": "Tiket tidak ditemukan"}), 404

    return jsonify({"message": f"Status tiket diperbarui ke {data['st']}"}), 200


@tickets_bp.route("/<id>", methods=["DELETE"])
def delete(id):
    """Hapus tiket."""
    if not Ticket.delete(id):
        return jsonify({"error": "Tiket tidak ditemukan"}), 404
    return jsonify({"message": "Tiket berhasil dihapus"}), 200
