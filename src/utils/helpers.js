// ── Date / Time helpers ──────────────────────────────────────────────────────

export function formatIndonesianDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatDate(date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function padTwo(n) {
  return String(n).padStart(2, '0');
}

export function convertDriveViewToThumbnailId(driveViewUrl) {
  const match = String(driveViewUrl).match(/\/d\/([a-zA-Z0-9_-]+)\/view/);
  return match ? match[1] : null;
}

// ── File helpers ─────────────────────────────────────────────────────────────

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
}

// ── Geolocation ──────────────────────────────────────────────────────────────

const geoOptions = { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 };

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser ini.'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, geoOptions);
    }
  });
}

// ── WhatsApp number formatter ────────────────────────────────────────────────

export function formatWhatsapp(rawNumber) {
  const cleaned = rawNumber.replace(/[^0-9+]/g, '');
  if (!cleaned.length) return '';
  if (cleaned.startsWith('+62')) return '0' + cleaned.substring(3);
  if (cleaned.startsWith('62'))  return '0' + cleaned.substring(2);
  if (cleaned.startsWith('0'))   return cleaned;
  return null;
}

// ── Calendar helpers ─────────────────────────────────────────────────────────

export const MONTH_NAMES = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

export function getDatesFromRange(startStr, endStr) {
  const dates = [];
  let cur = new Date(startStr);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endStr);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    dates.push(`${cur.getFullYear()}-${padTwo(cur.getMonth()+1)}-${padTwo(cur.getDate())}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// ── Device detection ─────────────────────────────────────────────────────────

export function isMobile() {
  try {
    const bowser = window.bowser || null;
    if (!bowser) return true; // default to mobile
    const parser = bowser.getParser(window.navigator.userAgent);
    return parser.getPlatform().type !== 'desktop';
  } catch {
    return true;
  }
}

export function getDeviceInfo() {
  try {
    if (!window.bowser) return 'Unknown Device';
    const browser = window.bowser.getParser(window.navigator.userAgent);
    const p = browser.getPlatform();
    const b = browser.getBrowser();
    const o = browser.getOS();
    return `${o.name} ${o.version}, ${b.name} ${b.version}`;
  } catch {
    return navigator.userAgent;
  }
}

// ── Cuti day limit by keterangan ─────────────────────────────────────────────

export const CUTI_LIMITS = {
  tahunan: 12,
  menikah: 3,
  menikahkanAnak: 2,
  menghitankanAnak: 2,
  membaptiskanAnak: 2,
  mentatahkanGigi: 1,
  istriMelahirkan: 2,
  melahirkan: 93,
  anggotaKeluargaSerumah: 1,
  siomamMeninggal: 2,
};
