# 🏢 Sistem Presensi Pegawai PertaMC (DWOWS-SPHR00660A)

Aplikasi web presensi pegawai modern berbasis **React (Vite)** di sisi frontend dan dirancang untuk backend **Node.js (Express.js)** dengan database **MySQL**.

## 📖 Dokumentasi API Contract Backend
Dokumentasi spesifikasi lengkap API Contract untuk pembuatan Backend Node.js tersedia di:
👉 **[API_CONTRACT.md](API_CONTRACT.md)**

Isi dokumentasi tersebut mencakup:
1. **Protokol Komunikasi**: Base URL, method, headers, dan setting Express body parser (`limit: '50mb'` untuk upload bukti Base64).
2. **Sistem Device Binding**: Registrasi perangkat berbasis No Pegawai & UUID.
3. **Spesifikasi 15 Endpoint**:
   - `binder`: Registrasi perangkat baru dan penerbitan UUID.
   - `getPosition`: Validasi GPS radius kantor.
   - `userAgent`: Inisialisasi profil pegawai & status presensi harian.
   - `check`: Check-In & Check-Out mandiri.
   - `aday`: Log presensi hari ini.
   - `amonth`: Riwayat log presensi bulanan (Presensi, Pending, Reject).
   - `adelete`: Hapus/batal log presensi hari ini.
   - `remove`: Batalkan pengajuan pending bulanan.
   - `add`: Pengajuan presensi manual susulan.
   - `edit`: Revisi jam presensi.
   - `check` (ketidakhadiran): Pengajuan Cuti, Izin, Sakit, Off Duty.
   - `autoLog` / `auto`: Buat rencana absensi otomatis multi-hari.
   - `showAuto` / `show`: Lihat daftar rencana Cuti & Off.
   - `updateAkun`: Perbarui nomor WA dan email pegawai.
   - `getAkunData`: Ambil data akun pegawai.
4. **Skema Database MySQL (DDL)**: DDL siap pakai untuk tabel `pegawai`, `perangkat_binding`, `lokasi_kantor`, `presensi_log`, `presensi_pending`, dan `rencana_auto`.
5. **Starter Template Node.js (`server.js`)**: Kode Express.js lengkap yang langsung mengimplementasikan seluruh endpoint di atas.

---

## 🚀 Menjalankan Frontend
```powershell
# Install dependensi
npm install

# Jalankan dev server
npm run dev

# Build untuk produksi
npm run build
```
Target backend diatur melalui variabel `VITE_API_BASE_URL` di file `.env`. Saat mode development, Vite proxy akan otomatis meneruskan request `/api` ke backend lokal tanpa hambatan CORS.