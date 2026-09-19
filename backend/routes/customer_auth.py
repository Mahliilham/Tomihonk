from flask import Blueprint, request, jsonify
from models.customer_user import CustomerUser

customer_auth_bp = Blueprint("customer_auth", __name__)


# ── POST register user baru ──
@customer_auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password") or not data.get("name"):
        return jsonify({"error": "Username, password, dan nama wajib diisi"}), 400
    doc, err = CustomerUser.create(data)
    if err:
        return jsonify({"error": err}), 409
    return jsonify({"message": "Registrasi berhasil", "user": doc}), 201


# ── POST login user ──
@customer_auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "")
    user = CustomerUser.find_by_credentials(username, password)
    if not user:
        return jsonify({"error": "Username atau password salah"}), 401
    return jsonify({"message": "Login berhasil", "user": user}), 200


# ── GET semua user (untuk admin) ──
@customer_auth_bp.route("/all", methods=["GET"])
def get_all():
    return jsonify(CustomerUser.get_all()), 200


# ── GET detail user by id ──
@customer_auth_bp.route("/<id>", methods=["GET"])
def get_one(id):
    user = CustomerUser.find_by_id(id)
    if not user:
        return jsonify({"error": "User tidak ditemukan"}), 404
    return jsonify(user), 200


# ── PUT aktifkan user & beri ID Pelanggan ──
@customer_auth_bp.route("/<id>/activate", methods=["PUT"])
def activate(id):
    ok, err = CustomerUser.activate(id)
    if not ok:
        return jsonify({"error": err or "Gagal mengaktifkan user"}), 404
    user = CustomerUser.find_by_id(id)
    return jsonify({"message": "User berhasil diaktifkan", "user": user}), 200


# ── PUT nonaktifkan user ──
@customer_auth_bp.route("/<id>/deactivate", methods=["PUT"])
def deactivate(id):
    ok = CustomerUser.deactivate(id)
    if not ok:
        return jsonify({"error": "User tidak ditemukan atau sudah tidak aktif"}), 404
    return jsonify({"message": "User berhasil dinonaktifkan"}), 200


# ── DELETE hapus user ──
@customer_auth_bp.route("/<id>", methods=["DELETE"])
def delete(id):
    ok = CustomerUser.delete(id)
    if not ok:
        return jsonify({"error": "User tidak ditemukan"}), 404
    return jsonify({"message": "Akun user berhasil dihapus"}), 200
