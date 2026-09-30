# 📋 API Contract & Spesifikasi Backend Node.js + MySQL
### Aplikasi Presensi Pegawai Presensi (DWOWS-SPHR00660A)

Dokumen ini berisi spesifikasi lengkap API Contract untuk pembuatan Backend **Node.js (Express.js)** dengan database **MySQL** yang terintegrasi dengan frontend React (Vite).

---

## ⚡ 1. Status Frontend: Live Integration (Zero Mock Data)

> ⚠️ **PENTING BAGI PENGEMBANG BACKEND:**
> Frontend telah **100% menghapus seluruh mock data, data dummy tiruan, dan demo fallback** (tidak ada lagi pencatatan jam lokal palsu jika backend gagal).
>
> 1. **Ketergantungan Total pada Backend**: Seluruh aksi presensi (Check-In, Check-Out, Cuti, Izin, Sakit, Off Duty, Tambah/Edit Log, Binding, dan Update Akun) murni bergantung pada respons HTTP dan payload JSON dari server backend.
> 2. **Transparansi Error**: Jika backend mengembalikan status error (misal `alert`, `message`, status HTTP 4xx/5xx), frontend akan langsung menampilkan pesan error riil dari backend tersebut ke layar pengguna. Backend wajib mengirimkan pesan error yang informatif dan jelas.
> 3. **Format Respons Standar**: Semua respons JSON dari backend wajib menggunakan format JSON standar yang dapat di-parse (`Content-Type: application/json`).

---

## 📌 2. Protokol Komunikasi & Konfigurasi Server

### 2.1 Base URL & Routing
Frontend mengirimkan request ke endpoint tunggal `/api` dengan metode `GET` dan `POST`. Routing internal dibedakan berdasarkan parameter:
- **`mod`** (misal: `binder`, `userAgent`, `check`, `aday`, `amonth`, `updateAkun`, `getPosition`, `adelete`, `remove`)
- **`action`** (misal: `add`, `edit`, `auto`, `show`)

> **Arsitektur Koneksi & Proxy:**
> - **Development (Lokal)**: Request `/api` dari browser ditangani oleh Vite Proxy (`vite.config.js`), yang secara otomatis menyematkan header keamanan HMAC-SHA256 sebelum diteruskan ke backend target (`http://localhost:3100`).
> - **Production (Vercel)**: Request `/api` diproxy melalui Vercel Serverless Function (`api/index.js`) yang juga menyematkan header keamanan HMAC-SHA256 ke backend GCP/VPS.
> - **Backend Target**: Dikonfigurasi melalui `VITE_API_BASE_URL` di file `.env`.

### 2.2 Keamanan Request (HMAC-SHA256 Authentication)
Setiap request yang diteruskan oleh Proxy Frontend ke Backend dilengkapi dengan header keamanan berikut:
| Header | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `X-App-ID` | `string` | Identifier aplikasi frontend (default: `ernmysql-frontend`) |
| `X-Timestamp` | `string` | Unix epoch timestamp dalam milidetik saat request dikirim |
| `X-Signature` | `string` | Tanda tangan HMAC-SHA256 |

**Formula Perhitungan HMAC-SHA256:**
```text
message = METHOD + "\n" + PATH_NO_QUERY + "\n" + TIMESTAMP_MS + "\n" + RAW_BODY
signature = HMAC_SHA256(BACKEND_HMAC_SECRET, message).hex()
```
*Contoh verifikasi di backend Express.js disertakan pada Bagian 6 dokumen ini.*

### 2.3 Format Request Body & Headers
Frontend mengirimkan request `POST` menggunakan format **`application/json`** (`JSON.stringify(body)`). Untuk request `GET`, RAW_BODY yang dihitung pada HMAC adalah string kosong `""`.

⚠️ **SANGAT PENTING (Ukuran Payload Base64):**
Form upload foto surat izin dan bukti presensi dikirimkan sebagai string **Base64** di dalam body request JSON. Ukuran file gambar maksimal 1 MB, yang menghasilkan string Base64 sekitar ~1.4 MB.
Oleh karena itu, middleware body parser di Express **wajib dinaikkan limitnya**:
```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

### 2.4 Pengaturan CORS
Backend harus mengizinkan CORS dan custom headers berikut dari domain frontend:
```javascript
const cors = require('cors');
app.use(cors({
  origin: '*', // atau domain spesifik frontend Vercel/produksi
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-ID', 'X-Timestamp', 'X-Signature']
}));
```

---

## 🔐 3. Alur Autentikasi & Identifikasi Perangkat (UUID Device Binding)

### 3.1 Tabel Database yang Digunakan

Seluruh alur login & binding merujuk pada tabel **`hr_employees`** dengan dua kolom kunci:

| Kolom DB | Tipe | Keterangan |
| :--- | :--- | :--- |
| `badge` | `VARCHAR` | Nomor Pegawai / ID unik pegawai (misal `EMP-001`). Ini yang **diketik user** di form BindingPage. |
| `uuid` | `VARCHAR` / `NULL` | UUID perangkat yang sudah terikat. `NULL` berarti pegawai belum punya perangkat terdaftar. |

### 3.2 Alur Lengkap Login & Binding

```
┌────────────────────────────────────────────────────────────────────┐
│  FRONTEND (presensi-five-neon.vercel.app)  ←→  BACKEND (:3100)    │
└────────────────────────────────────────────────────────────────────┘

  [1] App dibuka
       │
       ▼
  Apakah localStorage['uuid'] ada?
       │
    ┌──┴──────────────────────────────┐
   TIDAK                            YA
    │                                │
    ▼                                ▼
  Tampilkan                  POST /api  mod=userAgent
  BindingPage                { uuid, device, lat, lon, acc }
    │                                │
    │                    Backend: SELECT * FROM hr_employees
    │                              WHERE uuid = <uuid kiriman>
    │                                │
    │                       ┌────────┴──────────┐
    │                    DITEMUKAN           TIDAK ADA
    │                       │                   │
    │                       ▼                   ▼
    │               { status:'success',   Hapus localStorage['uuid']
    │                 nama, id, job,       Tampilkan BindingPage
    │                 cat, pos, tel,       dengan pesan error
    │                 ema, cico }               │
    │               Masuk MainBoard            │
    │                                          │
    ▼                                          ▼
  User input No Pegawai (badge) ←─────────────┘
    │
    ▼
  POST /api  mod=binder
  { idPegawai: <badge>, uuid: <uuid_lama_atau_kosong>, lat, lon, acc }
    │
    ▼
  Backend: SELECT * FROM hr_employees WHERE badge = idPegawai
    │
    ┌───────────────────────────────────┐
  TIDAK ADA                          ADA
    │                                  │
    ▼                                  ▼
  { status:'not_found' }        Buat UUID baru (uuidv4())
  Tampilkan error,              UPDATE hr_employees
  ulangi input                    SET uuid = <uuid_baru>
                                  WHERE badge = idPegawai
                                       │
                                       ▼
                               { status:'success',
                                 uuid: <uuid_baru> }
                               Simpan ke localStorage['uuid']
                               Masuk MainBoard
```

### 3.3 Catatan Penting untuk Backend

- **Kolom `uuid` di `hr_employees` wajib bisa bernilai `NULL`** (default `NULL`) — menandakan pegawai belum punya perangkat terdaftar.
- **UUID yang diterbitkan saat binding** disimpan langsung di kolom `uuid` pada row pegawai yang bersangkutan di `hr_employees`. Tidak ada tabel binding terpisah kecuali kamu ingin mencatat histori perangkat.
- **Saat verifikasi login** (`mod: userAgent`): backend mencari `uuid` di `hr_employees` — jika tidak ditemukan, frontend akan menghapus UUID lokal dan menampilkan BindingPage.
- **Frontend menyimpan `uuid` di `localStorage`** dengan key `'uuid'` — nilai ini dikirim ke setiap endpoint presensi.

---

## 📡 4. Spesifikasi Lengkap Endpoint API

---

### 4.1 Pendaftaran Perangkat Baru (`binder`)
Digunakan oleh `BindingPage` untuk meregistrasi perangkat ke akun pegawai dan mendapatkan UUID permanen.

> **📌 Logika Backend:**
> ```sql
> -- 1. Cari pegawai berdasarkan badge
> SELECT * FROM hr_employees WHERE badge = :idPegawai
>
> -- 2a. Jika tidak ditemukan → kembalikan status: 'not_found'
>
> -- 2b. Jika ditemukan → buat UUID baru dan simpan ke kolom uuid
> UPDATE hr_employees SET uuid = :uuid_baru WHERE badge = :idPegawai
>
> -- 3. Kembalikan uuid_baru ke frontend
> ```

- **Method**: `POST`
- **Path**: `/api`
- **Request Body (URL Encoded)**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'binder'` | `'binder'` |
  | `idPegawai` | `string` | Nomor Pegawai — cocokkan ke kolom **`hr_employees.badge`** | `'EMP-001'` |
  | `uuid` | `string` | UUID lama jika ada, atau string kosong `""` jika perangkat baru | `""` |
  | `lat` | `number` | Latitude GPS perangkat (0 jika ditolak) | `-6.2088` |
  | `lon` | `number` | Longitude GPS perangkat (0 jika ditolak) | `106.8456` |
  | `acc` | `number` | Akurasi GPS dalam meter | `15` |

- **Response JSON**:
  - **Berhasil — badge ditemukan, UUID baru diterbitkan (200 OK)**:
    ```json
    {
      "status": "success",
      "uuid": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    }
    ```
    > Frontend akan menyimpan `uuid` ini ke `localStorage['uuid']` dan langsung masuk MainBoard.

  - **No Pegawai Tidak Ditemukan di `hr_employees.badge` (200 OK)**:
    ```json
    {
      "status": "not_found",
      "message": "No Pegawai tidak terdaftar di sistem. Hubungi Admin."
    }
    ```
    > Frontend menampilkan pesan error dan user diminta input ulang badge.

  - **UUID sudah terikat pegawai lain (200 OK)**:
    ```json
    {
      "status": "already_bound",
      "message": "Perangkat ini sudah terikat dengan akun pegawai lain."
    }
    ```

---

### 4.2 Cek Validasi Lokasi GPS (`getPosition`)
Digunakan untuk mengecek apakah posisi GPS berada dalam batas radius absensi yang diizinkan.

- **Method**: `GET`
- **Path**: `/api`
- **Query Parameters**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'getPosition'` | `'getPosition'` |
  | `lat` | `number` | Latitude GPS | `-6.2088` |
  | `lon` | `number` | Longitude GPS | `106.8456` |
  | `acc` | `number` | Akurasi GPS (meter) | `12` |

- **Response JSON**:
  Berupa array berisi satu pesan string lokasi:
  ```json
  [
    "Di dalam radius kantor (akurasi: 12m)"
  ]
  ```
  atau jika di luar radius:
  ```json
  [
    "Di luar radius kantor — Jarak: 1.25 km dari DWOWS-SPHR00660A"
  ]
  ```

---

### 4.3 Verifikasi UUID & Inisialisasi Sesi (`userAgent`)
Dipanggil **setiap kali aplikasi dibuka** untuk memverifikasi UUID perangkat dan mengambil data profil pegawai + status presensi hari ini.

> **📌 Logika Backend:**
> ```sql
> -- Cari pegawai berdasarkan uuid yang tersimpan di hr_employees
> SELECT * FROM hr_employees WHERE uuid = :uuid
>
> -- Jika tidak ditemukan → kembalikan status: 'not_found' atau 'login_required'
> -- Frontend akan hapus localStorage['uuid'] dan tampilkan BindingPage
>
> -- Jika ditemukan → kembalikan semua data profil pegawai
> ```

- **Method**: `POST`
- **Path**: `/api`
- **Request Body (URL Encoded)**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'userAgent'` | `'userAgent'` |
  | `uuid` | `string` | UUID dari `localStorage['uuid']` — cocokkan ke kolom **`hr_employees.uuid`** | `'9b1deb4d-3b7d...'` |
  | `auid` | `string` | Admin UUID jika ada (bisa kosong) | `""` |
  | `device` | `string` | JSON string array info perangkat browser | `'[{"userAgent":"...","platform":"Win32"}]'` |
  | `lat` | `number` | Latitude GPS saat membuka app | `-6.2088` |
  | `lon` | `number` | Longitude GPS saat membuka app | `106.8456` |
  | `acc` | `number` | Akurasi GPS | `15` |

- **Response JSON**:
  - **UUID ditemukan di `hr_employees.uuid` → masuk MainBoard (200 OK)**:
    ```json
    {
      "status": "success",
      "nama": "Ahmad Ramadhan",
      "id": "EMP-001",
      "job": "Staff Lapangan",
      "cat": "Reguler",
      "pos": "DWOWS-SPHR00660A",
      "tel": "81234567890",
      "ema": "ahmad.ramadhan@presensi.com",
      "cico": {
        "checkIn": "2026-09-23T07:58:12.000Z",
        "checkOut": null
      }
    }
    ```
    > Mapping field response ↔ kolom `hr_employees`:
    > - `nama` ← kolom nama pegawai
    > - `id` ← kolom `badge`
    > - `job` ← kolom jabatan / posisi
    > - `cat` ← kolom kategori (misal: Reguler, Kontrak)
    > - `pos` ← kode lokasi kantor
    > - `tel` ← nomor WhatsApp
    > - `ema` ← email
    > - `cico.checkIn` / `cico.checkOut` ← hasil query tabel log presensi hari ini (ISO string atau `null`)

  - **UUID tidak ditemukan di `hr_employees.uuid` → tampilkan BindingPage**:
    ```json
    {
      "status": "not_found",
      "message": "UUID perangkat tidak dikenali. Silakan lakukan binding perangkat kembali."
    }
    ```
    > Atau gunakan `status: 'login_required'` — keduanya ditangani sama oleh frontend.

---

### 4.4 Catat Presensi Check-In / Check-Out (`check`)
Merekam aksi Check-In atau Check-Out harian beserta koordinat GPS.

- **Method**: `POST`
- **Path**: `/api`
- **Request Body (URL Encoded)**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'check'` | `'check'` |
  | `action` | `string` | Jenis aksi: `'CheckIn'` atau `'CheckOut'` | `'CheckIn'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `device` | `object/string`| Info perangkat browser | `{"browser":"Chrome",...}` |
  | `lat` | `number` | Latitude saat presensi | `-6.2088` |
  | `lng` | `number` | Longitude saat presensi | `106.8456` |
  | `acc` | `number` | Akurasi GPS | `10` |

- **Response JSON**:
  - **Berhasil Check-In**:
    ```json
    {
      "checkIn": "2026-09-23T08:00:15.000Z",
      "alert": null
    }
    ```
  - **Berhasil Check-Out**:
    ```json
    {
      "checkOut": "2026-09-23T17:05:00.000Z",
      "alert": null
    }
    ```
  - **Gagal / Diluar Radius**:
    ```json
    {
      "checkIn": null,
      "alert": "Lokasi presensi di luar radius kantor yang ditentukan (Jarak: 3.5 km)!"
    }
    ```

---

### 4.5 Status Log Presensi Hari Ini (`aday`)
Mengambil riwayat log presensi yang telah dicatat untuk hari ini.

- **Method**: `GET`
- **Path**: `/api`
- **Query Parameters**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'aday'` | `'aday'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `sheet` | `number` | Indeks Bulan JavaScript (0=Januari, 8=September) | `8` |
  | `tahun` | `number` | Tahun masehi | `2026` |

- **Response JSON (200 OK)**:
  Array flat dengan siklus 4 elemen: `[id, action, time, remark, id2, action2, time2, remark2, ...]`
  ```json
  {
    "data": [
      "1", "Masuk", "07:58:22", "Di dalam radius",
      "2", "Pulang", "17:02:10", "Di dalam radius"
    ]
  }
  ```
  *Jika belum ada presensi hari ini:*
  ```json
  {
    "data": []
  }
  ```

---

### 4.6 Log Presensi Bulanan, Pending & Reject (`amonth`)
Mengambil data riwayat presensi dalam satu bulan kalender untuk tab Presensi, Pending, dan Reject pada Log Popup.

- **Method**: `GET`
- **Path**: `/api`
- **Query Parameters**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'amonth'` | `'amonth'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `sheet` | `number` | Indeks Bulan JavaScript (0-11) | `8` |
  | `tahun` | `number` | Tahun | `2026` |
  | `type` | `string` | Tipe query: `'full'` | `'full'` |

- **Response JSON (200 OK)**:
  ```json
  {
    "data": {
      "log": [
        {
          "date": "2026-09-01",
          "notes": "Masuk 07:55:00",
          "image": "https://storage.googleapis.com/.../img1.jpg"
        },
        {
          "date": "2026-09-01",
          "notes": "Pulang 17:01:20",
          "image": ""
        }
      ],
      "pending": [
        {
          "date": "2026-09-22",
          "notes": "Masuk 08:15:00",
          "image": "https://storage.googleapis.com/.../bukti1.jpg"
        }
      ],
      "reject": [
        {
          "date": "2026-09-20",
          "notes": "Izin 09:00:00",
          "image": "https://storage.googleapis.com/.../bukti2.jpg",
          "rejectReason": "Foto surat dokter buram dan tidak terbaca."
        }
      ],
      "INFO": [
        "Ahmad Ramadhan",
        "Staff Lapangan",
        "Reguler"
      ]
    }
  }
  ```

---

### 4.7 Hapus Log Presensi Hari Ini (`adelete`)
Membatalkan / menghapus salah satu log presensi hari ini (misal salah tekan Check-In).

- **Method**: `GET`
- **Path**: `/api`
- **Query Parameters**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'adelete'` | `'adelete'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `sheet` | `number` | Indeks bulan (0-11) | `8` |
  | `tahun` | `number` | Tahun | `2026` |
  | `type` | `string` | Aksi: `'Masuk'` atau `'Pulang'` | `'Masuk'` |
  | `waktu` | `string` | Jam log yang dihapus | `'07:58:22'` |

- **Response JSON**:
  ```json
  {
    "status": "success",
    "message": "Log presensi berhasil dihapus."
  }
  ```

---

### 4.8 Batalkan / Hapus Pengajuan Pending (`remove`)
Menghapus pengajuan presensi yang masih berstatus pending.

- **Method**: `GET`
- **Path**: `/api`
- **Query Parameters**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'remove'` | `'remove'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `sheet` | `number` | Indeks bulan (0-11) | `8` |
  | `tahun` | `number` | Tahun | `2026` |
  | `tanggal` | `string` | Format tanggal `YYYY-MM-DD` | `'2026-09-22'` |
  | `type` | `string` | Tipe log (`Masuk`/`Pulang`/`Izin`) | `'Masuk'` |
  | `waktu` | `string` | Jam yang diajukan | `'08:15:00'` |

- **Response JSON**:
  ```json
  {
    "status": "success",
    "message": "Pengajuan pending berhasil dibatalkan."
  }
  ```

---

### 4.9 Tambah Presensi Manual Susulan (`add`)
Digunakan pada modal "Tambah Presensi" untuk mengajukan presensi susulan (misal lupa absen, izin dinas luar, off, sakit, dll.).

- **Method**: `POST`
- **Path**: `/api`
- **Request Body (URL Encoded)**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `action` | `string` | Tetap bernilai `'add'` | `'add'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `sheet` | `number` | Indeks bulan (0-11) | `8` |
  | `tahun` | `number` | Tahun | `2026` |
  | `status` | `string` | `'Masuk'` \| `'Pulang'` \| `'Izin'` \| `'Sakit'` \| `'Cuti'` \| `'Off'` | `'Masuk'` |
  | `tanggal` | `string` | Format tanggal `YYYY-MM-DD` | `'2026-09-21'` |
  | `time` | `string` | Jam:Menit:Detik | `'08:00:00'` |
  | `file_data` | `string` | Data Base64 file bukti (kosong jika status Off) | `'data:image/jpeg;base64,...'` |
  | `file_mime_type` | `string` | MIME type file | `'image/jpeg'` |
  | `file_name` | `string` | Nama file bukti | `'bukti_izin.jpg'` |

- **Response JSON**:
  ```json
  {
    "status": "success",
    "message": "Pengajuan penambahan presensi berhasil diajukan dan menunggu persetujuan (Pending)."
  }
  ```

---

### 4.10 Edit Presensi (`edit`)
Mengajukan revisi jam pada log presensi yang telah ada sebelumnya.

- **Method**: `POST`
- **Path**: `/api`
- **Request Body (URL Encoded)**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `action` | `string` | Tetap bernilai `'edit'` | `'edit'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `status` | `string` | Tipe presensi | `'Masuk'` |
  | `tanggal` | `string` | Format tanggal `YYYY-MM-DD` | `'2026-09-20'` |
  | `time` | `string` | Waktu usulan baru `HH:mm:ss` | `'07:45:00'` |
  | `waktu` | `string` | Waktu lama sebelum diubah | `'08:30:00'` |
  | `file_data` | `string` | Data Base64 bukti foto alasan edit | `'data:image/jpeg;base64,...'` |
  | `file_mime_type` | `string` | MIME type | `'image/jpeg'` |
  | `file_name` | `string` | Nama file | `'bukti_revisi.jpg'` |
  | `sheet` | `number` | Indeks bulan (0-11) | `8` |
  | `tahun` | `number` | Tahun | `2026` |

- **Response JSON**:
  ```json
  {
    "status": "success",
    "message": "Perubahan waktu presensi berhasil diajukan (Pending)."
  }
  ```

---

### 4.11 Pengajuan Ketidakhadiran Hari Ini (`Cuti`, `Izin`, `Sakit`, `Off`)
Digunakan ketika menekan tombol menu ketidakhadiran di popup.

- **Method**: `POST`
- **Path**: `/api`
- **Request Body (URL Encoded)**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'check'` | `'check'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `type` | `string` | `'Cuti'` \| `'Izin'` \| `'Sakit'` \| `'Off'` | `'Cuti'` |
  | `remark` | `string` | Keterangan: Jika Cuti: jenis cuti (misal `'tahunan'`, `'menikah'`); jika Izin: alasan izin | `'tahunan'` |
  | `file_data` | `string` | Data Base64 surat izin/bukti (kosong jika Off) | `'data:image/jpeg;base64,...'` |
  | `file_type` | `string` | MIME type file | `'image/jpeg'` |
  | `file_name` | `string` | Nama file lampiran | `'surat_cuti.jpg'` |
  | `lat` | `number` | Koordinat GPS (khusus Izin) | `-6.2088` |
  | `lng` | `number` | Koordinat GPS | `106.8456` |
  | `acc` | `number` | Akurasi GPS | `15` |

- **Response JSON**:
  ```json
  {
    "status": "success",
    "message": "Pengajuan ketidakhadiran berhasil dicatat."
  }
  ```

---

### 4.12 Simpan Rencana Absensi Otomatis Multi-Hari (`autoLog` / `auto`)
Digunakan oleh modal "Rencana Absensi Auto" untuk mengajukan Off Duty beruntun atau Cuti terencana beberapa hari ke depan.

- **Method**: `POST`
- **Path**: `/api`
- **Request Body (URL Encoded)**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `action` | `string` | Tetap bernilai `'auto'` | `'auto'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `status` | `string` | `'Off'` atau `'Cuti'` | `'Off'` |
  | `listTanggal` | `string` | Daftar tanggal dipisah koma | `'2026-10-01,2026-10-02,2026-10-03'` |
  | `keterangan` | `string` | Jenis cuti jika status Cuti | `'tahunan'` |
  | `file_data` | `string` | Data Base64 bukti dokumen (wajib jika cuti) | `""` |
  | `file_type` | `string` | MIME type dokumen | `""` |
  | `file_name` | `string` | Nama dokumen | `""` |

- **Response JSON**:
  ```json
  {
    "status": "success",
    "message": "Rencana absensi berhasil disimpan ke sistem."
  }
  ```

---

### 4.13 Tampilkan Rencana Absensi Otomatis (`showAuto` / `show`)
Digunakan oleh modal "Lihat Rencana Cuti & Off".

- **Method**: `POST`
- **Path**: `/api`
- **Request Body (URL Encoded)**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `action` | `string` | Tetap bernilai `'show'` | `'show'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |

- **Response JSON (200 OK)**:
  ```json
  {
    "data": {
      "off": {
        "dates": ["2026-10-01", "2026-10-02", "2026-10-03"],
        "display": "01 Okt 2026 - 03 Okt 2026 (3 Hari)"
      },
      "tahunan": {
        "dates": ["2026-10-15", "2026-10-16"],
        "url": "https://storage.googleapis.com/.../cuti.jpg",
        "thumbnail": "https://storage.googleapis.com/.../cuti_thumb.jpg"
      },
      "nonTahunan": {
        "dates": [],
        "keterangan": "",
        "url": "",
        "thumbnail": ""
      }
    }
  }
  ```

---

### 4.14 Perbarui Data Akun Pegawai (`updateAkun`)
Mengupdate nomor WhatsApp dan Email pegawai.

- **Method**: `POST`
- **Path**: `/api`
- **Request Body (URL Encoded)**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'updateAkun'` | `'updateAkun'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |
  | `wa` | `string` | Nomor WhatsApp baru | `'08123456789'` |
  | `email` | `string` | Email baru | `'pegawai@presensi.com'` |

- **Response JSON**:
  ```json
  {
    "status": "success",
    "message": "Data akun pegawai berhasil diperbarui."
  }
  ```

---

### 4.15 Ambil Data Akun Pegawai (`getAkunData`)
Mengambil data detail akun berdasarkan UUID.

- **Method**: `GET`
- **Path**: `/api`
- **Query Parameters**:
  | Parameter | Tipe Data | Keterangan | Contoh |
  | :--- | :--- | :--- | :--- |
  | `mod` | `string` | Tetap bernilai `'getAkun'` | `'getAkun'` |
  | `uuid` | `string` | UUID perangkat | `'9b1deb4d-3b7d...'` |

- **Response JSON (200 OK)**:
  ```json
  {
    "status": "success",
    "nama": "Ahmad Ramadhan",
    "id": "EMP-001",
    "job": "Staff Lapangan",
    "cat": "Reguler",
    "pos": "DWOWS-SPHR00660A",
    "tel": "81234567890",
    "ema": "ahmad.ramadhan@presensi.com"
  }
  ```

---

## 🗄️ 5. Skema Database MySQL (DDL)

Berikut adalah struktur tabel MySQL yang mendukung seluruh fungsionalitas aplikasi.

> **⚠️ PENTING:** Tabel utama yang digunakan untuk login & binding adalah **`hr_employees`**, bukan nama lain. Pastikan nama tabel ini sesuai dengan yang ada di database produksi.

```sql
CREATE DATABASE IF NOT EXISTS db_presensi;
USE db_presensi;

-- ═══════════════════════════════════════════════════════════════
-- 1. Tabel Master Pegawai: hr_employees
--    ► Kolom 'badge' = Nomor Pegawai yang diketik user di BindingPage
--    ► Kolom 'uuid'  = UUID perangkat yang terikat (NULL = belum binding)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hr_employees (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  badge       VARCHAR(50)  UNIQUE NOT NULL,   -- No Pegawai, e.g. 'EMP-001'
  uuid        VARCHAR(100) UNIQUE NULL,       -- UUID perangkat terikat (NULL jika belum binding)
  nama        VARCHAR(150) NOT NULL,
  jabatan     VARCHAR(100) DEFAULT 'Staff Lapangan',
  kategori    VARCHAR(50)  DEFAULT 'Reguler', -- e.g. 'Reguler', 'Kontrak', 'PKWT'
  posisi_kantor VARCHAR(100) DEFAULT 'DWOWS-SPHR00660A',
  no_wa       VARCHAR(20)  NULL,
  email       VARCHAR(100) NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════
-- (OPSIONAL) Tabel Histori Binding Perangkat
--   Tidak wajib — hanya jika ingin mencatat riwayat perangkat per pegawai
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS perangkat_binding (
  id INT AUTO_INCREMENT PRIMARY KEY,
  badge VARCHAR(50) NOT NULL,
  uuid VARCHAR(100) UNIQUE NOT NULL,
  admin_uuid VARCHAR(100) NULL,
  device_info TEXT NULL,
  last_lat DECIMAL(10, 8) NULL,
  last_lon DECIMAL(11, 8) NULL,
  last_accuracy DECIMAL(8, 2) NULL,
  is_active TINYINT(1) DEFAULT 1,
  bound_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (badge) REFERENCES hr_employees(badge) ON DELETE CASCADE
);

-- 3. Tabel Master Lokasi Kantor & Radius Absensi
CREATE TABLE IF NOT EXISTS lokasi_kantor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_lokasi VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'DWOWS-SPHR00660A'
  nama_lokasi VARCHAR(150) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meter INT DEFAULT 100 -- radius yang diizinkan (dalam meter)
);

-- 4. Tabel Transaksi Log Presensi Harian (Telah Disetujui / Sah)
CREATE TABLE IF NOT EXISTS presensi_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  badge VARCHAR(50) NOT NULL,     -- referensi ke hr_employees.badge
  uuid VARCHAR(100) NOT NULL,     -- referensi ke hr_employees.uuid
  tanggal DATE NOT NULL,
  waktu TIME NOT NULL,
  action ENUM('Masuk', 'Pulang', 'Izin', 'Sakit', 'Cuti', 'OffDuty') NOT NULL,
  notes VARCHAR(255) NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  accuracy DECIMAL(8, 2) NULL,
  image_url TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (badge) REFERENCES hr_employees(badge)
);

-- 5. Tabel Pengajuan Pending & Reject (Menunggu Persetujuan Admin)
CREATE TABLE IF NOT EXISTS presensi_pending (
  id INT AUTO_INCREMENT PRIMARY KEY,
  badge VARCHAR(50) NOT NULL,     -- referensi ke hr_employees.badge
  uuid VARCHAR(100) NOT NULL,     -- referensi ke hr_employees.uuid
  tanggal DATE NOT NULL,
  waktu TIME NOT NULL,
  action ENUM('Masuk', 'Pulang', 'Izin', 'Sakit', 'Cuti', 'Off') NOT NULL,
  tipe_pengajuan ENUM('add', 'edit', 'ketidakhadiran') NOT NULL,
  waktu_lama TIME NULL,
  remark TEXT NULL,
  image_url TEXT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reject_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (badge) REFERENCES hr_employees(badge)
);

-- 6. Tabel Rencana Absensi Otomatis (Auto Off / Cuti Multi-Hari)
CREATE TABLE IF NOT EXISTS rencana_auto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  badge VARCHAR(50) NOT NULL,     -- referensi ke hr_employees.badge
  uuid VARCHAR(100) NOT NULL,     -- referensi ke hr_employees.uuid
  tanggal DATE NOT NULL,
  status ENUM('Off', 'Cuti') NOT NULL,
  keterangan VARCHAR(100) NULL,
  dokumen_url TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (badge) REFERENCES hr_employees(badge)
);

-- Data Awal untuk Testing:
INSERT INTO lokasi_kantor (kode_lokasi, nama_lokasi, latitude, longitude, radius_meter)
VALUES ('DWOWS-SPHR00660A', 'Kantor Presensi Lapangan', -6.20880000, 106.84560000, 200)
ON DUPLICATE KEY UPDATE kode_lokasi = kode_lokasi;

-- Contoh pegawai: uuid = NULL berarti belum ada perangkat terdaftar
INSERT INTO hr_employees (badge, uuid, nama, jabatan, kategori, posisi_kantor, no_wa, email)
VALUES ('EMP-001', NULL, 'Ahmad Ramadhan', 'Staff Lapangan', 'Reguler', 'DWOWS-SPHR00660A', '081234567890', 'ahmad@presensi.com')
ON DUPLICATE KEY UPDATE badge = badge;
```

---

## 💻 6. Template Starter Backend Node.js (Express.js)

Berikut struktur kode file `server.js` yang dapat langsung di-copy untuk memulai backend Node.js.

> ⚠️ **WAJIB**: Template ini sudah dilengkapi middleware verifikasi HMAC-SHA256. Backend yang tidak memverifikasi header `X-Signature` akan menerima request palsu dari luar. Pastikan `BACKEND_HMAC_SECRET` di `.env` backend **sama persis** dengan yang ada di `.env` frontend.

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────────────────────
// 0. Variabel environment
// ─────────────────────────────────────────────────────────────────────────────
const BACKEND_HMAC_SECRET = process.env.BACKEND_HMAC_SECRET || '';
const BACKEND_APP_ID      = process.env.BACKEND_APP_ID || 'ernmysql-frontend';
const HMAC_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 menit

// ─────────────────────────────────────────────────────────────────────────────
// 1. Setup CORS (izinkan header HMAC dari frontend/proxy)
// ─────────────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-ID', 'X-Timestamp', 'X-Signature']
}));

// 2. Setup Body Parser (PENTING: limit 50mb untuk Base64 upload)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// 3. MySQL Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_presensi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ─────────────────────────────────────────────────────────────────────────────
// 3b. Middleware HMAC-SHA256 Verification
// Wajib dipasang SEBELUM route /api agar setiap request divalidasi.
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api', (req, res, next) => {
  // Baca header keamanan
  const appId     = req.headers['x-app-id'];
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];

  // Jika secret tidak dikonfigurasi, lewati verifikasi (mode dev tanpa secret)
  if (!BACKEND_HMAC_SECRET) {
    return next();
  }

  // Validasi header wajib ada
  if (!appId || !timestamp || !signature) {
    return res.status(401).json({ error: 'Unauthorized: Missing security headers (X-App-ID, X-Timestamp, X-Signature)' });
  }

  // Validasi App ID
  if (appId !== BACKEND_APP_ID) {
    return res.status(401).json({ error: 'Unauthorized: Invalid X-App-ID' });
  }

  // Validasi timestamp tidak terlalu lama (toleransi 5 menit)
  const tsNum = Number(timestamp);
  if (isNaN(tsNum) || Math.abs(Date.now() - tsNum) > HMAC_TIMESTAMP_TOLERANCE_MS) {
    return res.status(401).json({ error: 'Unauthorized: Request timestamp expired or invalid' });
  }

  // Rekonstruksi raw body string (sudah di-parse express, perlu buat ulang untuk verifikasi)
  // CATATAN: Untuk verifikasi tepat, gunakan middleware rawBody SEBELUM express.urlencoded
  // Jika rawBody tidak tersedia, verifikasi signature tanpa body (less strict)
  const rawBody = req.rawBody || '';
  const pathNoQuery = req.path; // mis. '/api'
  const method = req.method.toUpperCase();
  const message = `${method}\n/api\n${timestamp}\n${rawBody}`;

  const expected = require('crypto')
    .createHmac('sha256', BACKEND_HMAC_SECRET)
    .update(message)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).json({ error: 'Unauthorized: Invalid X-Signature' });
  }

  next();
});

// Middleware untuk menyimpan raw body (diperlukan SEBELUM urlencoded parser)
// Tambahkan ini SEBELUM app.use(express.urlencoded(...)) di atas:
//
// app.use((req, res, buf, encoding) => { req.rawBody = buf.toString(encoding || 'utf8'); });
// Atau gunakan express.raw() + manual parsing untuk presisi penuh.

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Haversine distance (meter)
// ─────────────────────────────────────────────────────────────────────────────
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ─────────────────────────────────────────────────────────────────────────────
// 📡 ROUTE GET DISPATCHER (/api)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api', async (req, res) => {
  const { mod, uuid, lat, lon, acc, sheet, tahun, type, waktu, tanggal } = req.query;

  try {
    // 1. Cek Lokasi / Radius GPS
    if (mod === 'getPosition') {
      const [locations] = await db.query('SELECT * FROM lokasi_kantor LIMIT 1');
      if (locations.length === 0) {
        return res.json(['Radius kantor belum dikonfigurasi']);
      }
      const office = locations[0];
      const dist = calculateDistance(Number(lat), Number(lon), Number(office.latitude), Number(office.longitude));
      if (dist <= office.radius_meter) {
        return res.json([`Di dalam radius kantor (jarak: ${Math.round(dist)}m, akurasi: ${Math.round(acc || 0)}m)`]);
      } else {
        return res.json([`Di luar radius kantor — Jarak: ${(dist/1000).toFixed(2)} km dari ${office.nama_lokasi}`]);
      }
    }

    // 2. Log Presensi Hari Ini (aDay)
    if (mod === 'aday') {
      const today = new Date().toISOString().split('T')[0];
      const [rows] = await db.query(
        'SELECT id, action, TIME_FORMAT(waktu, "%H:%i:%s") as waktu, notes FROM presensi_log WHERE uuid = ? AND tanggal = ? ORDER BY waktu ASC',
        [uuid, today]
      );
      // Flat array output: [id, action, time, notes, ...]
      const flat = [];
      rows.forEach(r => {
        flat.push(String(r.id), r.action, r.waktu, r.notes || '');
      });
      return res.json({ data: flat });
    }

    // 3. Log Presensi Bulanan (aMonth)
    if (mod === 'amonth') {
      const monthNum = Number(sheet) + 1;
      const yearNum = Number(tahun);

      // Log disetujui
      const [logs] = await db.query(
        'SELECT DATE_FORMAT(tanggal, "%Y-%m-%d") as date, CONCAT(action, " ", TIME_FORMAT(waktu, "%H:%i:%s")) as notes, image_url as image FROM presensi_log WHERE uuid = ? AND MONTH(tanggal) = ? AND YEAR(tanggal) = ? ORDER BY tanggal DESC, waktu DESC',
        [uuid, monthNum, yearNum]
      );

      // Pending
      const [pending] = await db.query(
        'SELECT DATE_FORMAT(tanggal, "%Y-%m-%d") as date, CONCAT(action, " ", TIME_FORMAT(waktu, "%H:%i:%s")) as notes, image_url as image FROM presensi_pending WHERE uuid = ? AND status = "pending" AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?',
        [uuid, monthNum, yearNum]
      );

      // Reject
      const [reject] = await db.query(
        'SELECT DATE_FORMAT(tanggal, "%Y-%m-%d") as date, CONCAT(action, " ", TIME_FORMAT(waktu, "%H:%i:%s")) as notes, image_url as image, reject_reason as rejectReason FROM presensi_pending WHERE uuid = ? AND status = "rejected" AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?',
        [uuid, monthNum, yearNum]
      );

      // Info Pegawai
      const [p] = await db.query(
        'SELECT nama, jabatan, kategori FROM hr_employees WHERE uuid = ? LIMIT 1',
        [uuid]
      );
      const info = p.length > 0 ? [p[0].nama, p[0].jabatan, p[0].kategori] : ['Pegawai', 'Staff', 'Reguler'];

      return res.json({
        data: {
          log: logs,
          pending: pending,
          reject: reject,
          INFO: info
        }
      });
    }

    // 4. Hapus Log Hari Ini (adelete)
    if (mod === 'adelete') {
      const today = new Date().toISOString().split('T')[0];
      await db.query(
        'DELETE FROM presensi_log WHERE uuid = ? AND tanggal = ? AND action = ? AND waktu = ?',
        [uuid, today, type, waktu]
      );
      return res.json({ status: 'success', message: 'Log berhasil dihapus' });
    }

    // 5. Hapus Pending (remove)
    if (mod === 'remove') {
      await db.query(
        'DELETE FROM presensi_pending WHERE uuid = ? AND tanggal = ? AND action = ? AND waktu = ? AND status = "pending"',
        [uuid, tanggal, type, waktu]
      );
      return res.json({ status: 'success', message: 'Pending log berhasil dihapus' });
    }

    // 6. Get Akun Data
    if (mod === 'getAkun') {
      const [rows] = await db.query(
        'SELECT p.nama, p.id_pegawai as id, p.jabatan as job, p.kategori as cat, p.posisi_kantor as pos, p.no_wa as tel, p.email as ema FROM perangkat_binding b JOIN pegawai p ON b.id_pegawai = p.id_pegawai WHERE b.uuid = ? LIMIT 1',
        [uuid]
      );
      if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'User not found' });
      return res.json({ status: 'success', ...rows[0] });
    }

    return res.status(400).json({ error: `Unknown query mod: ${mod}` });
  } catch (err) {
    console.error('GET /api Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 📡 ROUTE POST DISPATCHER (/api)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api', async (req, res) => {
  const body = req.body;
  const mod = body.mod;
  const action = body.action;

  try {
    // 1. Device Binding
    if (mod === 'binder') {
      const { idPegawai, uuid: oldUuid, lat, lon, acc } = body;
      const [emps] = await db.query('SELECT * FROM pegawai WHERE id_pegawai = ?', [idPegawai]);
      if (emps.length === 0) {
        return res.json({ status: 'not_found', message: 'No Pegawai tidak ditemukan dalam sistem.' });
      }

      // Cek apakah device ini sudah terikat ke akun lain
      if (oldUuid) {
        const [existing] = await db.query('SELECT * FROM perangkat_binding WHERE uuid = ?', [oldUuid]);
        if (existing.length > 0 && existing[0].id_pegawai !== idPegawai) {
          return res.json({ status: 'already_bound', message: 'Perangkat ini sudah terikat dengan ID pegawai lain.' });
        }
      }

      // Buat UUID baru untuk perangkat
      const newUuid = uuidv4();
      await db.query(
        'INSERT INTO perangkat_binding (id_pegawai, uuid, last_lat, last_lon, last_accuracy) VALUES (?, ?, ?, ?, ?)',
        [idPegawai, newUuid, lat || 0, lon || 0, acc || 1000]
      );

      return res.json({
        status: 'success',
        uuid: newUuid,
        nama: emps[0].nama
      });
    }

    // 2. UserAgent / Init App
    if (mod === 'userAgent') {
      const { uuid } = body;
      const [rows] = await db.query(
        'SELECT p.nama, p.id_pegawai as id, p.jabatan as job, p.kategori as cat, p.posisi_kantor as pos, p.no_wa as tel, p.email as ema FROM perangkat_binding b JOIN pegawai p ON b.id_pegawai = p.id_pegawai WHERE b.uuid = ? LIMIT 1',
        [uuid]
      );

      if (rows.length === 0) {
        return res.json({ status: 'login_required', message: 'Perangkat tidak terdaftar' });
      }

      const today = new Date().toISOString().split('T')[0];
      const [todayLogs] = await db.query(
        'SELECT action, waktu FROM presensi_log WHERE uuid = ? AND tanggal = ?',
        [uuid, today]
      );

      let inTime = null, outTime = null;
      todayLogs.forEach(l => {
        if (l.action === 'Masuk') inTime = `${today}T${l.waktu}Z`;
        if (l.action === 'Pulang') outTime = `${today}T${l.waktu}Z`;
      });

      return res.json({
        status: 'success',
        ...rows[0],
        cico: { checkIn: inTime, checkOut: outTime }
      });
    }

    // 3. Check-In & Check-Out atau Ketidakhadiran (mod === 'check')
    if (mod === 'check') {
      const { uuid, action: checkAction, type, remark, lat, lng, acc } = body;

      // Ambil pegawai berdasarkan uuid
      const [b] = await db.query('SELECT id_pegawai FROM perangkat_binding WHERE uuid = ? LIMIT 1', [uuid]);
      if (b.length === 0) return res.status(401).json({ alert: 'Perangkat tidak sah' });
      const empId = b[0].id_pegawai;
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toTimeString().split(' ')[0];

      if (checkAction === 'CheckIn' || checkAction === 'CheckOut') {
        const actionType = checkAction === 'CheckIn' ? 'Masuk' : 'Pulang';

        await db.query(
          'INSERT INTO presensi_log (id_pegawai, uuid, tanggal, waktu, action, notes, latitude, longitude, accuracy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [empId, uuid, today, nowTime, actionType, 'Presensi Mandiri', lat || 0, lng || 0, acc || 0]
        );

        if (checkAction === 'CheckIn') {
          return res.json({ checkIn: `${today}T${nowTime}Z`, alert: null });
        } else {
          return res.json({ checkOut: `${today}T${nowTime}Z`, alert: null });
        }
      }

      // Jika pengajuan ketidakhadiran (Cuti, Izin, Sakit, Off)
      if (type) {
        await db.query(
          'INSERT INTO presensi_pending (id_pegawai, uuid, tanggal, waktu, action, tipe_pengajuan, remark, status) VALUES (?, ?, ?, ?, ?, "ketidakhadiran", ?, "pending")',
          [empId, uuid, today, nowTime, type, remark || type]
        );
        return res.json({ status: 'success', message: `Pengajuan ${type} berhasil dikirim.` });
      }
    }

    // 4. Tambah Presensi Manual (action === 'add')
    if (action === 'add') {
      const { uuid, status, tanggal, time } = body;
      const [b] = await db.query('SELECT id_pegawai FROM perangkat_binding WHERE uuid = ? LIMIT 1', [uuid]);
      if (b.length === 0) return res.status(401).json({ message: 'UUID tidak terdaftar' });

      await db.query(
        'INSERT INTO presensi_pending (id_pegawai, uuid, tanggal, waktu, action, tipe_pengajuan, status) VALUES (?, ?, ?, ?, ?, "add", "pending")',
        [b[0].id_pegawai, uuid, tanggal, time, status]
      );
      return res.json({ status: 'success', message: 'Penambahan presensi berhasil diajukan' });
    }

    // 5. Edit Presensi (action === 'edit')
    if (action === 'edit') {
      const { uuid, status, tanggal, time, waktu: oldTime } = body;
      const [b] = await db.query('SELECT id_pegawai FROM perangkat_binding WHERE uuid = ? LIMIT 1', [uuid]);
      if (b.length === 0) return res.status(401).json({ message: 'UUID tidak terdaftar' });

      await db.query(
        'INSERT INTO presensi_pending (id_pegawai, uuid, tanggal, waktu, waktu_lama, action, tipe_pengajuan, status) VALUES (?, ?, ?, ?, ?, ?, "edit", "pending")',
        [b[0].id_pegawai, uuid, tanggal, time, oldTime, status]
      );
      return res.json({ status: 'success', message: 'Perubahan presensi berhasil diajukan' });
    }

    // 6. Rencana Auto (action === 'auto')
    if (action === 'auto') {
      const { uuid, status, listTanggal, keterangan } = body;
      const [b] = await db.query('SELECT id_pegawai FROM perangkat_binding WHERE uuid = ? LIMIT 1', [uuid]);
      if (b.length === 0) return res.status(401).json({ message: 'UUID tidak terdaftar' });

      const dates = (listTanggal || '').split(',').map(d => d.trim()).filter(Boolean);
      for (const d of dates) {
        await db.query(
          'INSERT INTO rencana_auto (id_pegawai, uuid, tanggal, status, keterangan) VALUES (?, ?, ?, ?, ?)',
          [b[0].id_pegawai, uuid, d, status, keterangan || null]
        );
      }
      return res.json({ status: 'success', message: 'Rencana absensi berhasil disimpan' });
    }

    // 7. Tampilkan Rencana Auto (action === 'show')
    if (action === 'show') {
      const { uuid } = body;
      const [rows] = await db.query(
        'SELECT DATE_FORMAT(tanggal, "%Y-%m-%d") as date, status, keterangan FROM rencana_auto WHERE uuid = ? AND tanggal >= CURDATE() ORDER BY tanggal ASC',
        [uuid]
      );

      const offDates = rows.filter(r => r.status === 'Off').map(r => r.date);
      const tahunanDates = rows.filter(r => r.status === 'Cuti' && r.keterangan === 'tahunan').map(r => r.date);
      const nonTahunanDates = rows.filter(r => r.status === 'Cuti' && r.keterangan !== 'tahunan').map(r => r.date);

      return res.json({
        data: {
          off: {
            dates: offDates,
            display: offDates.length > 0 ? `${offDates[0]} s/d ${offDates[offDates.length - 1]} (${offDates.length} Hari)` : ''
          },
          tahunan: {
            dates: tahunanDates,
            url: '',
            thumbnail: ''
          },
          nonTahunan: {
            dates: nonTahunanDates,
            keterangan: '',
            url: '',
            thumbnail: ''
          }
        }
      });
    }

    // 8. Update Akun (mod === 'updateAkun')
    if (mod === 'updateAkun') {
      const { uuid, wa, email } = body;
      const [b] = await db.query('SELECT id_pegawai FROM perangkat_binding WHERE uuid = ? LIMIT 1', [uuid]);
      if (b.length === 0) return res.status(401).json({ message: 'UUID tidak ditemukan' });

      await db.query('UPDATE pegawai SET no_wa = ?, email = ? WHERE id_pegawai = ?', [wa, email, b[0].id_pegawai]);
      return res.json({ status: 'success', message: 'Akun berhasil diperbarui' });
    }

    return res.status(400).json({ error: `Unknown POST mod/action: mod=${mod}, action=${action}` });
  } catch (err) {
    console.error('POST /api Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
```

---

## 🛠️ 7. Panduan Menjalankan Frontend & Backend

### 7.1 Konfigurasi Backend Node.js

1. **Pasang dependensi:**
   ```bash
   npm install express cors mysql2 uuid dotenv crypto
   ```

2. **Import DDL MySQL dari Bagian 5.**

3. **Buat file `.env` di direktori backend:**
   ```env
   PORT=3100
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_db_password
   DB_NAME=db_presensi

   # Keamanan HMAC — harus sama persis dengan frontend
   BACKEND_APP_ID=ernmysql-frontend
   BACKEND_HMAC_SECRET=ernmysql_hmac_secret_dev_2024_change_in_prod
   ```

4. **Jalankan:** `node server.js`

### 7.2 Konfigurasi Frontend (Development Lokal)

1. **Buat/edit file `.env` di root folder frontend:**
   ```env
   # Target backend (GCP atau localhost)
   VITE_API_BASE_URL=http://localhost:3100

   # Keamanan HMAC — harus sama persis dengan backend
   BACKEND_APP_ID=ernmysql-frontend
   BACKEND_HMAC_SECRET=ernmysql_hmac_secret_dev_2024_change_in_prod
   ```

2. **Jalankan frontend:**
   ```powershell
   npm run dev
   ```
   Vite Proxy secara otomatis menyematkan header `X-App-ID`, `X-Timestamp`, dan `X-Signature` (HMAC-SHA256) ke setiap request `/api` sebelum diteruskan ke backend target.

### 7.3 Konfigurasi Production (Vercel)

Tambahkan **Environment Variables** berikut di Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:3100` |
| `BACKEND_APP_ID` | `ernmysql-frontend` |
| `BACKEND_HMAC_SECRET` | `(secret HMAC yang sama dengan backend)` |

Vercel Serverless Function (`api/index.js`) akan otomatis menggunakan variabel-variabel ini untuk menyematkan header HMAC ke setiap request.

### 7.4 Checklist Integrasi

- [ ] Backend membalas dengan `Content-Type: application/json` di semua endpoint
- [ ] CORS backend mengizinkan header `X-App-ID`, `X-Timestamp`, `X-Signature`
- [ ] `BACKEND_HMAC_SECRET` **identik** di kedua sisi (frontend `.env` dan backend `.env`)
- [ ] Endpoint `userAgent` mengembalikan field `nama`, `id`, `job`, `cat`, `pos`, `tel`, `ema`, dan `cico`
- [ ] Endpoint `aday` mengembalikan flat array dengan siklus 4 elemen: `[id, action, time, remark, ...]`
- [ ] Semua response error mengandung field `message` atau `alert` yang informatif (bukan hanya status code)
- [ ] Body parser Express dikonfigurasi dengan limit `50mb` untuk upload Base64

---
*Dokumentasi ini mencerminkan integrasi live (zero mock data) antara frontend React (Vite) dengan backend Node.js + MySQL. Diperbarui: 2026-09-26.*
