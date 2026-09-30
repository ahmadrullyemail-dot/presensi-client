import { jsPDF } from 'jspdf';
import { formatIndonesianDate } from './helpers';

/**
 * downloadPresensiPDF — generates attendance PDF report matching the original GAS implementation
 *
 * @param {Object} logss - { INFO: [nama, jabatan, kategori], log: [], pending: [], reject: [] }
 * @param {Object} akun - { nama, job, cat } (fallback if INFO not present)
 */
export function downloadPresensiPDF(logss, akun) {
  const doc = new jsPDF();
  let output = 'LAPORAN DATA ABSENSI\n';
  output += '==============================\n';
  output += 'download tanggal: ' + formatIndonesianDate(new Date()) + '\n\n';

  const infoNama = logss?.INFO?.[0] || akun?.nama || 'N/A';
  const infoJob = logss?.INFO?.[1] || akun?.job || 'N/A';
  const infoCat = logss?.INFO?.[2] || akun?.cat || 'N/A';

  output += 'INFORMASI UMUM\n';
  output += '------------------------------\n';
  output += 'Nama: ' + infoNama + '\n';
  output += 'Jabatan/Posisi: ' + infoJob + '\n';
  output += 'Kategori: ' + infoCat + '\n\n';

  const formatLogArray = (title, logsList = [], includeReason = false) => {
    output += title + '\n';
    output += '------------------------------\n';
    if (!logsList || logsList.length === 0) {
      output += 'Tidak ada data.\n\n';
      return;
    }

    logsList.forEach((log, index) => {
      output += `${index + 1}. ID: ${log.id || '-'}, Tanggal: ${log.date || '-'}\n`;
      output += `   Catatan: ${log.notes || '-'}\n`;
      if (log.image) {
        const fileIdMatch = String(log.image).match(/\/d\/([a-zA-Z0-9_-]+)\/view/);
        const imageList = (fileIdMatch && fileIdMatch[1])
          ? `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}`
          : log.image;
        output += `   Tautan Gambar: ${imageList}\n`;
      }
      if (includeReason && log.rejectReason) {
        output += `   Alasan Tolak: ${log.rejectReason}\n`;
      }
    });
    output += '\n';
  };

  formatLogArray('LOG TERSIMPAN', logss?.log || []);
  formatLogArray('LOG TERTUNDA', logss?.pending || []);
  formatLogArray('LOG DITOLAK', logss?.reject || [], true);

  const textLines = doc.splitTextToSize(output, 190);
  let y = 10;
  doc.setFontSize(10);

  textLines.forEach(line => {
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
    doc.text(line, 10, y);
    y += 7;
  });

  doc.save(`LaporanAbsensi${new Date().getTime()}.pdf`);
}
