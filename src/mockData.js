/**
 * mockData.js -- Data dummy untuk mode Demo/Preview
 *
 * Digunakan ketika UUID === 'DEMO' agar app bisa masuk
 * MainBoard tanpa koneksi ke backend.
 */

export const DEMO_UUID = 'DEMO';

/** Response tiruan dari endpoint userAgent */
export const mockUserAgent = {
  status: 'success',
  nama: 'Ahmad Rizky',
  id: 'EMP-001',
  job: 'Frontend Developer',
  cat: 'Karyawan Tetap',
  pos: 'Divisi Teknologi',
  tel: '08123456789',
  ema: 'ahmad.rizky@perusahaan.com',
  cico: { checkIn: null, checkOut: null },
};

/** Format flat array: [id, action, time, remark, ...] */
export const mockADay = {
  status: 'success',
  data: [
    'LOG-001', 'Masuk', '08:02:14', '',
    'LOG-002', 'Pulang', '17:05:33', '',
  ],
};

/** Response tiruan dari endpoint amonth */
export const mockAMonth = {
  status: 'success',
  data: {
    bulan: {
      INFO: ['Ahmad Rizky', 'Frontend Developer', 'Karyawan Tetap'],
      log: [
        { date: '2026-09-30', notes: 'Masuk 07:58:22', image: null, rejectReason: '' },
        { date: '2026-09-30', notes: 'Pulang 17:02:10', image: null, rejectReason: '' },
        { date: '2026-09-29', notes: 'Masuk 08:01:14', image: null, rejectReason: '' },
        { date: '2026-09-29', notes: 'Pulang 17:03:45', image: null, rejectReason: '' },
        { date: '2026-09-28', notes: 'Masuk 08:05:00', image: null, rejectReason: '' },
        { date: '2026-09-28', notes: 'Pulang 17:00:12', image: null, rejectReason: '' },
        { date: '2026-09-27', notes: 'Off Duty', image: null, rejectReason: '' },
        { date: '2026-09-26', notes: 'Masuk 08:10:00', image: null, rejectReason: '' },
        { date: '2026-09-26', notes: 'Pulang 17:00:00', image: null, rejectReason: '' },
        { date: '2026-09-25', notes: 'Masuk 07:58:30', image: null, rejectReason: '' },
        { date: '2026-09-25', notes: 'Pulang 17:15:20 Lembur', image: null, rejectReason: '' },
        { date: '2026-09-24', notes: 'Masuk 08:02:10', image: null, rejectReason: '' },
        { date: '2026-09-24', notes: 'Pulang 17:01:05', image: null, rejectReason: '' },
      ],
      pending: [
        { date: '2026-09-24', notes: 'Izin 09:00:00 Urusan Keluarga Mendesak', image: null, rejectReason: '' },
        { date: '2026-09-23', notes: 'Masuk 08:30:00 Kendala Kendaraan', image: null, rejectReason: '' },
      ],
      reject: [
        { date: '2026-09-20', notes: 'Cuti Liburan', image: null, rejectReason: 'Kuota cuti tahunan belum mencukupi' },
        { date: '2026-09-15', notes: 'Sakit Surat Dokter Tidak Jelas', image: null, rejectReason: 'Foto surat keterangan dokter buram dan tidak terbaca' },
      ],
    },
  },
};

/** Response tiruan dari endpoint showAuto */
export const mockShowAuto = {
  status: 'success',
  data: [
    { tanggal: '2026-10-05', type: 'Cuti', keterangan: 'Hari Raya' },
    { tanggal: '2026-10-12', type: 'Off Duty', keterangan: 'Jadwal Off' },
  ],
};
