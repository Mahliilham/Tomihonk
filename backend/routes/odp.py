from flask import Blueprint, request, jsonify
from models.odp import ODP

odp_bp = Blueprint("odp", __name__)

@odp_bp.route("", methods=["GET"])
def get_all():
    return jsonify(ODP.get_all()), 200

@odp_bp.route("", methods=["POST"])
def create():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body kosong"}), 400

    if not data.get("kode") or not data.get("alamat"):
        return jsonify({"error": "Kode ODP dan Alamat wajib diisi"}), 400

    doc = ODP.create(data)
    return jsonify({"message": "Titik ODP berhasil ditambahkan", "data": doc}), 201

@odp_bp.route("/<id>", methods=["PUT"])
def update(id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body kosong"}), 400

    if not ODP.update(id, data):
        return jsonify({"error": "Titik ODP tidak ditemukan atau gagal diupdate"}), 404

    return jsonify({"message": "Titik ODP berhasil diperbarui"}), 200

@odp_bp.route("/<id>", methods=["DELETE"])
def delete(id):
    if not ODP.delete(id):
        return jsonify({"error": "Titik ODP tidak ditemukan"}), 404
    return jsonify({"message": "Titik ODP berhasil dihapus"}), 200
