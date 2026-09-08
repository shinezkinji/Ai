"""
AP AI - Chatbot AI yang bisa cari jawaban di internet dan kasih sumbernya.
Menggunakan Claude API (Anthropic) dengan fitur web search.

Cara pakai:
1. pip install anthropic
2. Set environment variable ANTHROPIC_API_KEY dengan API key kamu
3. Jalankan: python chatbot.py
"""

import os
from anthropic import Anthropic

NAMA_AI = "AP AI"

# Ambil API key dari environment variable (jangan hardcode API key di kode!)
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Tool web search bawaan Anthropic
TOOLS = [
    {
        "type": "web_search_20250305",
        "name": "web_search"
    }
]


def chat_with_ai(pesan_user, riwayat=None):
    """Kirim pesan ke AP AI, biarkan dia cari di internet kalau perlu, lalu kembalikan balasan + sumbernya."""
    if riwayat is None:
        riwayat = []

    riwayat.append({"role": "user", "content": pesan_user})

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1500,
        tools=TOOLS,
        messages=riwayat
    )

    balasan_teks = ""
    sumber = []

    for blok in response.content:
        if blok.type == "text":
            balasan_teks += blok.text
            # Ambil sumber/citation kalau ada
            if hasattr(blok, "citations") and blok.citations:
                for c in blok.citations:
                    url = getattr(c, "url", None)
                    judul = getattr(c, "title", None)
                    if url and (url, judul) not in sumber:
                        sumber.append((url, judul))

    riwayat.append({"role": "assistant", "content": response.content})
    return balasan_teks, sumber, riwayat


def main():
    print(f"=== {NAMA_AI} - Tanya Jawab dengan Sumber Internet ===")
    print("Ketik 'keluar' untuk berhenti.\n")

    riwayat = []
    while True:
        pesan = input("Kamu: ")
        if pesan.lower() == "keluar":
            print("Sampai jumpa!")
            break

        balasan, sumber, riwayat = chat_with_ai(pesan, riwayat)
        print(f"{NAMA_AI}: {balasan}")

        if sumber:
            print("\nSumber:")
            for url, judul in sumber:
                label = judul if judul else url
                print(f"  - {label} ({url})")
        print()


if __name__ == "__main__":
    main()
