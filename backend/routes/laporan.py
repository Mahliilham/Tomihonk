from flask import Blueprint, request, jsonify
from models.laporan import Laporan
from models.ticket import Ticket

laporan_bp = Blueprint("laporan", __name__)


@laporan_bp.route("", methods=["GET"])
def get_all():
    return jsonify(Laporan.get_all()), 200


@laporan_bp.route("/teknisi/<tek_id>", methods=["GET"])
def get_by_teknisi(tek_id):
    return jsonify(Laporan.get_by_teknisi(tek_id)), 200


@laporan_bp.route("/<id>", methods=["GET"])
def get_one(id):
    """Ambil satu laporan by ID — dipakai halaman penilaian pelanggan."""
    doc = Laporan.get_by_id(id)
    if not doc:
        return jsonify({"error": "Laporan tidak ditemukan"}), 404
    return jsonify(doc), 200


@laporan_bp.route("", methods=["POST"])
def create():
    data = request.get_json()
    if not data or not data.get("pel") or not data.get("ticketId"):
        return jsonify({"error": "Data laporan tidak lengkap"}), 400
    doc = Laporan.create(data)
    # Otomatis set status tiket menjadi selesai
    ticket_id = data.get("ticketId")
    if ticket_id:
        Ticket.update_status(ticket_id, "selesai")
    return jsonify({"message": "Laporan berhasil disimpan", "data": doc}), 201


@laporan_bp.route("/<id>/feedback", methods=["PATCH"])
def submit_feedback(id):
    """Terima penilaian pelanggan: rating, saran_kritik, ttd."""
    # Cek apakah laporan ada
    doc = Laporan.get_by_id(id)
    if not doc:
        return jsonify({"error": "Laporan tidak ditemukan"}), 404
    if doc.get("feedbackSubmitted"):
        return jsonify({"error": "Penilaian sudah pernah dikirim"}), 409

    data = request.get_json()
    rating = data.get("rating", 0)
    saran_kritik = data.get("saranKritik", "")
    ttd = data.get("ttd", "")

    if not rating or rating < 1 or rating > 5:
        return jsonify({"error": "Rating harus antara 1–5"}), 400
    if not ttd:
        return jsonify({"error": "Tanda tangan wajib diisi"}), 400

    ok = Laporan.update_feedback(id, rating, saran_kritik, ttd)
    if not ok:
        return jsonify({"error": "Gagal menyimpan penilaian"}), 500
    return jsonify({"message": "Penilaian berhasil disimpan"}), 200


@laporan_bp.route("/<id>", methods=["DELETE"])
def delete(id):
    ok = Laporan.delete(id)
    if not ok:
        return jsonify({"error": "Laporan tidak ditemukan"}), 404
    return jsonify({"message": "Laporan berhasil dihapus"}), 200

