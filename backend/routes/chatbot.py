import requests
import json
from flask import Blueprint, request, jsonify

chatbot_bp = Blueprint("chatbot", __name__)

N8N_WEBHOOK_URL = "https://chatbottomihonk.app.n8n.cloud/webhook/chatbot"


def extract_reply(result):
    """
    Ekstrak teks balasan dari response n8n.
    Workflow ini mengembalikan: { "success": true, "reply": "..." }
    """
    if isinstance(result, list):
        result = result[0] if result else {}

    if isinstance(result, str):
        return result

    return (
        result.get("reply") 
        or result.get("output")   
        or result.get("text")
        or result.get("message")
        or result.get("response")
        or result.get("answer")
        or result.get("content")
        or None
    )


@chatbot_bp.route("/send", methods=["POST"])
def send_message():
    data = request.get_json()
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Pesan tidak boleh kosong"}), 400

    # Ambil sessionId dari request (untuk memory percakapan)
    session_id = data.get("sessionId", "default-session")

    try:
        # Kirim dengan format yang sesuai workflow n8n:
        # Edit Fields node membaca: $json.body.chatInput dan $json.body.sessionId
        n8n_response = requests.post(
            N8N_WEBHOOK_URL,
            json={
                "chatInput": message,
                "sessionId": session_id,
            },
            headers={"Content-Type": "application/json"},
            timeout=30,
        )

        # Log raw response untuk debugging
        print(f"\n[CHATBOT] User message  : {message}")
        print(f"[CHATBOT] n8n status    : {n8n_response.status_code}")
        print(f"[CHATBOT] n8n raw body  : {n8n_response.text[:500]}")

        # Handle n8n-specific errors
        if n8n_response.status_code == 404:
            return jsonify({
                "error": "Workflow AI tidak aktif. Pastikan workflow n8n sudah di-Activate."
            }), 503

        if n8n_response.status_code >= 400:
            return jsonify({
                "error": f"Layanan AI merespons dengan error {n8n_response.status_code}: {n8n_response.text[:200]}"
            }), 502

        # Parse response
        try:
            result = n8n_response.json()
        except Exception:
            # Kalau bukan JSON, kembalikan sebagai teks biasa
            result = n8n_response.text.strip()

        print(f"[CHATBOT] n8n parsed    : {json.dumps(result, ensure_ascii=False)[:500]}")

        reply = extract_reply(result)

        if not reply:
            print(f"[CHATBOT] WARNING: Tidak bisa ekstrak reply dari: {result}")
            reply = "Maaf, saya tidak dapat memproses permintaan Anda saat ini."

        print(f"[CHATBOT] Bot reply     : {reply[:200]}\n")

        return jsonify({"reply": reply}), 200

    except requests.exceptions.Timeout:
        return jsonify({"error": "Koneksi ke AI timeout, coba lagi."}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Tidak dapat terhubung ke layanan AI. Periksa koneksi internet."}), 503
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Gagal menghubungi layanan AI: {str(e)}"}), 502


@chatbot_bp.route("/debug", methods=["GET"])
def debug_n8n():
    """Endpoint debug: kirim pesan test ke n8n dan tampilkan raw response."""
    try:
        n8n_response = requests.post(
            N8N_WEBHOOK_URL,
            json={"message": "halo"},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        try:
            result = n8n_response.json()
        except Exception:
            result = n8n_response.text

        return jsonify({
            "status_code": n8n_response.status_code,
            "raw_response": result,
            "extracted_reply": extract_reply(result) if isinstance(result, (dict, list)) else result,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
