import random
import time
import requests
from flask import Blueprint, request, jsonify
from config import FONNTE_TOKEN  # Tambahkan di config.py

verifikasi_bp = Blueprint("verifikasi", __name__)

# ── Penyimpanan OTP sementara di memori ──
# Format: { "628xxxxxxxxxx": { "otp": "123456", "expires": timestamp, "nama": "..." } }
_otp_store: dict = {}

OTP_EXPIRY_SECONDS = 300  # OTP berlaku 5 menit


def _normalize_hp(hp: str) -> str:
    """Ubah format HP ke format internasional (628xxx) untuk Fonnte."""
    hp = hp.strip().replace(" ", "").replace("-", "")
    if hp.startswith("0"):
        hp = "62" + hp[1:]
    elif hp.startswith("+"):
        hp = hp[1:]
    return hp


def _send_wa_otp(hp_intl: str, otp: str, nama: str) -> bool:
    """Kirim OTP via WhatsApp menggunakan Fonnte API."""
    pesan = (
        f"Halo *{nama}*! 👋\n\n"
        f"Berikut Kode OTP Anda untuk mengirim keluhan ke *PT.Tomihonk* adalah:\n\n"
        f"🔐 *{otp}*\n\n"
        f"Kode berlaku selama *5 menit*. Jangan bagikan kode ini kepada siapapun.\n\n"
        f"_Admin Tomihonk_"
    )
    try:
        resp = requests.post(
            "https://api.fonnte.com/send",
            headers={"Authorization": FONNTE_TOKEN},
            data={
                "target": hp_intl,
                "message": pesan,
                "countryCode": "62",
            },
            timeout=10,
        )
        result = resp.json()
        return result.get("status") is True
    except Exception as e:
        print(f"[OTP] Gagal kirim WA: {e}")
        return False


@verifikasi_bp.route("/kirim-otp", methods=["POST"])
def kirim_otp():
    """
    Terima nama + HP, generate OTP 6 digit,
    simpan di memori, kirim via WhatsApp (Fonnte).
    """
    data = request.get_json()
    nama = (data.get("nama") or "").strip()
    hp_raw = (data.get("hp") or "").strip()

    if not nama or not hp_raw:
        return jsonify({"error": "Nama dan No. HP wajib diisi"}), 400

    hp_intl = _normalize_hp(hp_raw)

    # Cegah spam: jika OTP masih aktif (< 60 detik), tolak
    existing = _otp_store.get(hp_intl)
    if existing and time.time() < existing["expires"] - (OTP_EXPIRY_SECONDS - 60):
        sisa = int(existing["expires"] - (OTP_EXPIRY_SECONDS - 60) - time.time())
        return jsonify({"error": f"OTP sudah dikirim. Tunggu {sisa} detik sebelum kirim ulang."}), 429

    # Generate OTP
    otp = str(random.randint(100000, 999999))

    # Simpan di memori
    _otp_store[hp_intl] = {
        "otp": otp,
        "nama": nama,
        "hp_raw": hp_raw,
        "expires": time.time() + OTP_EXPIRY_SECONDS,
    }

    # Kirim via WA
    ok = _send_wa_otp(hp_intl, otp, nama)
    if not ok:
        # Hapus dari store jika gagal kirim
        _otp_store.pop(hp_intl, None)
        return jsonify({"error": "Gagal mengirim OTP via WhatsApp. Pastikan nomor HP aktif."}), 500

    return jsonify({
        "message": f"OTP berhasil dikirim ke WhatsApp {hp_raw[:4]}****{hp_raw[-3:]}",
        "hp_masked": f"{hp_raw[:4]}****{hp_raw[-3:]}",
    }), 200


@verifikasi_bp.route("/verifikasi-otp", methods=["POST"])
def verifikasi_otp():
    """
    Terima HP + kode OTP, cocokkan dengan yang tersimpan.
    Jika valid, hapus dari store dan return sukses.
    """
    data = request.get_json()
    hp_raw = (data.get("hp") or "").strip()
    kode = (data.get("otp") or "").strip()

    if not hp_raw or not kode:
        return jsonify({"error": "HP dan kode OTP wajib diisi"}), 400

    hp_intl = _normalize_hp(hp_raw)
    record = _otp_store.get(hp_intl)

    if not record:
        return jsonify({"error": "OTP tidak ditemukan. Minta OTP baru."}), 404

    if time.time() > record["expires"]:
        _otp_store.pop(hp_intl, None)
        return jsonify({"error": "OTP sudah kedaluwarsa. Minta OTP baru."}), 410

    if record["otp"] != kode:
        return jsonify({"error": "Kode OTP salah. Periksa kembali pesan WhatsApp Anda."}), 401

    # Hapus OTP setelah berhasil
    nama = record["nama"]
    _otp_store.pop(hp_intl, None)

    return jsonify({
        "valid": True,
        "nama": nama,
        "hp": hp_raw,
        "message": "Verifikasi berhasil",
    }), 200
