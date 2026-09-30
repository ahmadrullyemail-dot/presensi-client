# 🏢 Sistem Presensi

Aplikasi web **presensi pegawai** modern berbasis **React 19 + Vite 8** di sisi frontend, dirancang untuk bekerja bersama backend **Node.js (Express.js)** dengan database **MySQL**.

---

## 📋 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Struktur Folder](#-struktur-folder)
- [Demo Mode (Tanpa Backend)](#-demo-mode-tanpa-backend)
- [Menjalankan Frontend](#-menjalankan-frontend)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Arsitektur Keamanan HMAC](#-arsitektur-keamanan-hmac)
- [Alur Aplikasi](#-alur-aplikasi)
- [Fitur Utama](#-fitur-utama)
- [Dokumentasi API Contract](#-dokumentasi-api-contract-backend)
- [Deployment (Vercel)](#-deployment-vercel)
- [Mengganti Logo](#-mengganti-logo)

---

## 🛠 Tech Stack

| Kategori      | Teknologi                          |
|---------------|------------------------------------|
| Framework     | React 19 + Vite 8                  |
| Styling       | Bootstrap 5.3 + Vanilla CSS        |
| Font          | Inter (Google Fonts)               |
| PDF Export    | jsPDF 4                            |
| Device detect | Bowser 2                           |
| Backend       | Node.js + Express.js (terpisah)    |
| Database      | MySQL                              |
| Deployment    | Vercel (Serverless)                |

---

## 📁 Struktur Folder

```
ClientPresensi/
├── .env                        # Environment variables
├── index.html                  # Entry point HTML
├── package.json
├── vite.config.js              # Vite + HMAC proxy dev middleware
├── vercel.json                 # Konfigurasi routing Vercel
├── API_CONTRACT.md             # Dokumentasi lengkap 15 endpoint API
│
├── public/
│   ├── logo-sample.svg         # Logo header (ganti dengan logo asli)
│   ├── favicon.svg
│   └── icons.svg
│
├── api/
│   └── index.js                # Vercel Serverless Function (proxy + HMAC signing)
│
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Root component dan routing
    ├── mockData.js             # Data dummy untuk Demo Mode
    ├── index.css               # Global styles
    │
    ├── api/
    │   └── api.js              # Semua fungsi pemanggilan API
    ├── lib/
    │   └── apiClient.ts        # HTTP client wrapper
    ├── utils/
    │   ├── helpers.js          # GPS, device info, format tanggal
    │   └── pdfGenerator.js     # Generate PDF laporan presensi
    │
    └── components/
        ├── BindingPage.jsx         # Pendaftaran perangkat (+ tombol Demo)
        ├── MainBoard.jsx           # Dashboard: jam, status hari ini
        ├── BottomNavBar.jsx        # Navigasi bawah dengan FAB
        ├── ConfirmationModal.jsx   # Modal konfirmasi generik
        ├── LoadingOverlay.jsx      # Loading spinner fullscreen
        ├── modals/
        │   ├── AddLogModal.jsx         # Presensi manual susulan
        │   ├── EditLogModal.jsx        # Revisi jam presensi
        │   ├── KetidakhadiranModal.jsx # Cuti / Izin / Sakit / Off
        │   ├── PlanAutoModal.jsx       # Rencana absensi multi-hari
        │   └── ShowAutoModal.jsx       # Daftar rencana aktif
        ├── popups/
        │   ├── CicoPopup.jsx   # Check-In dan Check-Out
        │   ├── IzinPopup.jsx   # Pengajuan izin
        │   ├── LogPopup.jsx    # Riwayat log bulanan + PDF
        │   ├── PlanPopup.jsx   # Navigasi rencana absen
        │   └── AkunPopup.jsx   # Info dan edit akun
        └── widgets/
            ├── CalendarPicker.jsx       # Pilih satu tanggal
            ├── CalendarMultiPicker.jsx  # Pilih banyak tanggal
            └── TimePicker.jsx           # Pilih jam dan menit
```

---

## 🔍 Demo Mode (Tanpa Backend)

Aplikasi dilengkapi **Demo Mode** untuk melihat tampilan penuh MainBoard tanpa memerlukan koneksi ke backend maupun akun pegawai.

### Cara Mengaktifkan
1. Buka aplikasi — akan muncul halaman **Binding**
2. Klik tombol **"🔍 Lihat Demo"** di bagian bawah form

### Cara Keluar dari Demo
```
DevTools (F12) → Application → Local Storage → hapus key uuid → Refresh
```

### Data Demo (dari src/mockData.js)

| Data             | Isi                                                   |
|------------------|-------------------------------------------------------|
| Profil           | Ahmad Rizky · EMP-001 · Frontend Developer            |
| Log Hari Ini     | Masuk 08:02:14 · Pulang 17:05:33 (Lembur)            |
| Log Bulanan      | 10 hari hadir, 1 pending (Izin), 1 reject (Cuti)     |
| Rencana Auto     | Cuti 05 Okt · Off Duty 12 Okt                         |

> Untuk mengganti data demo, edit file src/mockData.js.

---

## 🚀 Menjalankan Frontend

```powershell
# 1. Install dependensi
npm install

# 2. Salin dan isi file environment
copy .env.example .env

# 3. Jalankan dev server
npm run dev
# → http://localhost:5173

# 4. Build untuk produksi
npm run build

# 5. Preview hasil build
npm run preview
```

---

## ⚙️ Konfigurasi Environment

Buat file .env di root proyek:

```env
# URL backend Node.js/Express (tanpa trailing slash)
# Kosongkan jika backend berjalan di localhost:3100 (default dev proxy)
VITE_API_BASE_URL=

# HMAC Secret — harus sama persis dengan nilai di backend
VITE_HMAC_SECRET=

# App ID yang dikirim di header X-App-ID ke backend
BACKEND_APP_ID=

# HMAC Secret khusus untuk Vercel Serverless (production)
BACKEND_HMAC_SECRET=
```

> Untuk development tanpa backend, gunakan **Demo Mode**.
> Untuk development dengan backend lokal, pastikan backend berjalan di localhost:3100.

---

## 🔐 Arsitektur Keamanan HMAC

Setiap request ke backend diproteksi dengan **HMAC-SHA256 signature**.

**Rumus HMAC:**
```
message   = METHOD + "\n" + PATH + "\n" + TIMESTAMP_MS + "\n" + RAW_BODY
signature = HMAC-SHA256(secret, message)
```

Header yang dikirim ke backend:

| Header        | Nilai                              |
|---------------|------------------------------------|
| X-App-ID      | Nama aplikasi (dari env)           |
| X-Timestamp   | Unix timestamp dalam milliseconds  |
| X-Signature   | HMAC-SHA256 hex digest             |

- **Development:** Proxy oleh plugin Vite di ite.config.js → target localhost:3100
- **Production:** Proxy oleh Vercel Serverless Function di pi/index.js

---

## 🔄 Alur Aplikasi

```
Buka App
    │
    ▼
[ Checking ] ── verifikasi UUID di localStorage
    │
    ├── Tidak ada UUID ──────────────► [ Binding Page ]
    │                                       │
    │                                       ├── Klik "🔍 Lihat Demo" ──► uuid=DEMO ──► [ Main Board ]
    │                                       │                                           (data mock)
    │                                       └── Input No Pegawai + Binding ──────────► [ Main Board ]
    │                                                                                   (data real)
    ├── UUID = DEMO ────────────────► [ Main Board ] (mock data, tanpa API call)
    │
    └── UUID ada ──► panggil userAgent API
            │
            ├── success ──────────► [ Main Board ]
            └── gagal/expired ────► [ Binding Page ]
```

---

## ✨ Fitur Utama

| Fitur                        | Komponen                         | Keterangan                                      |
|------------------------------|-----------------------------------|-------------------------------------------------|
| Device Binding               | BindingPage.jsx                 | Ikat perangkat dengan No Pegawai + UUID         |
| Demo Mode                    | BindingPage.jsx + mockData.js | Preview app tanpa backend                       |
| Real-time Clock              | MainBoard.jsx                   | Jam & tanggal update setiap detik               |
| Check-In / Check-Out         | CicoPopup.jsx                   | Presensi mandiri dengan validasi GPS            |
| Log Hari Ini                 | MainBoard.jsx                   | Status Masuk/Pulang/Cuti/Izin/Sakit/OffDuty     |
| Riwayat Bulanan              | LogPopup.jsx                    | Tab: Presensi · Pending · Reject                |
| Download PDF                 | pdfGenerator.js                 | Export laporan presensi bulanan ke PDF          |
| Presensi Susulan             | AddLogModal.jsx                 | Ajukan log untuk tanggal lampau                 |
| Revisi Jam                   | EditLogModal.jsx                | Koreksi waktu masuk/pulang yang sudah tercatat  |
| Pengajuan Ketidakhadiran     | KetidakhadiranModal.jsx         | Cuti · Izin · Sakit · Off Duty                  |
| Rencana Auto Multi-hari      | PlanAutoModal.jsx               | Jadwalkan Cuti/Off untuk banyak tanggal sekaligus |
| Edit Akun                    | AkunPopup.jsx                   | Perbarui nomor WA dan email                     |
| GPS Validation               | helpers.js                      | Validasi radius kantor saat check-in/out        |

---

## 📖 Dokumentasi API Contract Backend

Dokumentasi spesifikasi lengkap tersedia di: 👉 **[API_CONTRACT.md](API_CONTRACT.md)**

Isi dokumentasi mencakup:
1. **Protokol Komunikasi** — Base URL, method, headers, body parser limit 50mb
2. **Sistem Device Binding** — Registrasi perangkat berbasis No Pegawai & UUID
3. **Spesifikasi 15 Endpoint** — inder, getPosition, userAgent, check, day, month, delete, emove, dd, edit, utoLog/auto, showAuto/show, updateAkun, getAkunData
4. **Skema Database MySQL (DDL)** — Tabel pegawai, perangkat_binding, lokasi_kantor, presensi_log, presensi_pending, encana_auto
5. **Starter Template Node.js** — server.js siap pakai yang mengimplementasikan seluruh endpoint

---

## ☁️ Deployment (Vercel)

File ercel.json sudah dikonfigurasi:
- Request /api/* → Serverless Function pi/index.js
- Request lain → SPA React (index.html)

```powershell
# Deploy ke Vercel
npx vercel

# Set environment variables di Vercel Dashboard:
# VITE_API_BASE_URL, BACKEND_APP_ID, BACKEND_HMAC_SECRET
```

---

## 🎨 Mengganti Logo

Logo header menggunakan file public/logo-sample.svg.

**Opsi A — Timpa file SVG:**
```powershell
copy path\ke\logo-perusahaan.svg .\public\logo-sample.svg
```

**Opsi B — Ganti path di kode** (edit dua file):
- src/components/MainBoard.jsx baris src="/logo-sample.svg"
- src/components/BindingPage.jsx baris src="/logo-sample.svg"

> Ukuran yang disarankan: lebar maks **220px**, tinggi maks **80px**

---

## 🧑‍💻 Pengembangan Lanjutan

| Tugas                               | File yang Perlu Diubah                       |
|-------------------------------------|----------------------------------------------|
| Ganti data demo                     | src/mockData.js                            |
| Tambah endpoint API baru            | src/api/api.js + API_CONTRACT.md        |
| Ubah warna / tema aplikasi          | src/index.css                              |
| Tambah tab di riwayat log           | src/components/popups/LogPopup.jsx        |
| Ganti format PDF laporan            | src/utils/pdfGenerator.js                 |
| Konfigurasi backend production      | .env + pi/index.js                     |
| Ganti logo header                   | public/logo-sample.svg                    |
