# Asuna AI — Sistem Keamanan Jaringan (Animasi) + Chatbot

Proyek ini punya dua bagian:

1. **`index.html` + `style.css` + `script.js`** — halaman web (dipisah rapi ala proyek profesional) berisi animasi visual sistem keamanan jaringan (paket data mengalir, firewall memblokir ancaman secara real-time, judul dengan efek glow bergerak, dan scanline halus) dan panel tanya-jawab **Asuna AI** yang bisa mencari jawaban di internet lengkap dengan sumbernya.
2. **`chatbot.py`** — versi command-line dari Asuna AI (jalan di terminal, bukan browser).

## Menjalankan `index.html` (versi web dengan animasi) — GRATIS pakai Groq

1. Buka file `index.html` langsung di browser (double click), atau host di GitHub Pages.
2. Ambil API key **gratis** (tanpa kartu kredit, limit sekitar 14.400 request/hari) di [console.groq.com/keys](https://console.groq.com/keys) — cukup daftar/login.
3. Di kotak **"Groq API Key"**, masukkan key tersebut (formatnya diawali `gsk_...`).
4. Ketik pertanyaan di kolom chat, misalnya *"Apa itu serangan DDoS dan cara mencegahnya?"* — Asuna AI otomatis mencari info terbaru lewat web search bawaan Groq dan menampilkan sumbernya.

⚠️ **Peringatan keamanan:** API key dimasukkan langsung dari browser (client-side) supaya demo ini bisa jalan tanpa server. Ini **hanya aman untuk pemakaian pribadi/lokal atau demo/presentasi**. Kalau halaman ini di-hosting publik (misalnya GitHub Pages untuk banyak orang), setiap pengunjung perlu memasukkan API key mereka sendiri — key kamu tidak akan bocor ke orang lain selama tidak dibagikan. Untuk produk publik yang serius dengan banyak pengguna, sebaiknya panggilan API dipindah ke backend/server agar key tidak pernah menyentuh browser pengguna.

## Menjalankan `chatbot.py` (versi terminal — opsional, pakai Anthropic Claude/berbayar)

> Catatan: file ini terpisah dari `index.html` dan masih menggunakan Anthropic API (berbayar). Kalau kamu cuma butuh yang gratis, cukup pakai `index.html` di atas dan lewati bagian ini.

1. **Install dependency:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Siapkan API Key:**
   ```bash
   export ANTHROPIC_API_KEY="api-key-kamu-disini"
   ```
3. **Jalankan:**
   ```bash
   python chatbot.py
   ```

## Cara Upload ke GitHub

```bash
git init
git add .
git commit -m "Asuna AI - animasi keamanan jaringan + chatbot"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Kalau mau langsung online tanpa server, aktifkan **GitHub Pages** di Settings repo → Pages → pilih branch `main` → halaman `index.html` otomatis jadi website hidup.

⚠️ **Penting:** Jangan pernah commit API key ke dalam file kode. Masukkan key langsung di kotak input browser (untuk `index.html`) atau lewat environment variable (untuk `chatbot.py`).

## Fitur

- Animasi Canvas: trafik jaringan yang dipindai, diteruskan, atau diblokir firewall secara real-time
- Statistik langsung: jumlah paket dipindai, lolos, dan diblokir
- Tanya jawab dengan Asuna AI, terintegrasi web search + sumber referensi

## Struktur File

- `index.html` — struktur halaman
- `style.css` — semua styling & animasi CSS (glow, scanline, tema warna, dsb)
- `script.js` — logika animasi Canvas + chat Asuna AI
- `avatar.jpg` — foto profil Asuna AI (ditampilkan bulat di header & tiap balasan chat)
- `chatbot.py` — versi terminal Asuna AI
- `requirements.txt` — daftar library untuk `chatbot.py`
- `README.md` — dokumentasi ini

Pastikan semua file (`index.html`, `style.css`, `script.js`, `avatar.jpg`) berada dalam satu folder yang sama supaya saling terhubung.
