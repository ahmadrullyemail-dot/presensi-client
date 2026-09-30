/**
 * api.js — Centralized API layer
 *
 * All calls to the GCP Node.js backend go through here.
 * Set VITE_API_BASE_URL in .env to point at your backend.
 *
 * The parameters mirror the original Google Apps Script endpoint
 * so you can easily map them to your backend routes.
 */

import { request } from '../lib/apiClient';

// Semua request diarahkan ke /api pada origin aplikasi, yang kemudian diproxy
// dan disematkan header keamanan (X-App-ID, X-Timestamp, X-Signature):
// - Di local development: oleh Vite proxy (vite.config.js)
// - Di production: oleh Vercel Serverless Function (api/index.js)
const BASE_URL = import.meta.env.VITE_CLIENT_BASE_URL || '';

async function get(params) {
  const qs = new URLSearchParams(params).toString();
  return request('GET', `${BASE_URL}/api?${qs}`);
}

async function post(body) {
  return request('POST', `${BASE_URL}/api`, body);
}

// ── Binding — registrasi perangkat baru ─────────────────────────────────────
//
// Payload POST:
//   mod         : 'binder'
//   idPegawai   : string   — No Pegawai (uppercase, e.g. 'EMP-001')
//   uuid        : string | null — UUID lama jika ada, null jika device baru
//   lat         : number   — latitude GPS (0 jika tidak diizinkan)
//   lon         : number   — longitude GPS (0 jika tidak diizinkan)
//   acc         : number   — akurasi GPS dalam meter (1000 jika tidak diizinkan)
//
// Response JSON yang diharapkan dari server:
//   { status: 'success',      uuid: '<uuid baru>',  admin_uuid?: '<auid>', nama?: string }
//   { status: 'already_bound', message: 'Perangkat sudah terikat' }
//   { status: 'not_found',     message: 'No Pegawai tidak ditemukan' }
//   { status: 'login_required', message: '...' }
export async function binder(payload) {
  return post({
    mod: 'binder',
    idPegawai: payload.idPegawai,
    uuid: payload.uuid || '',
    lat: payload.lat ?? 0,
    lon: payload.lon ?? 0,
    acc: payload.acc ?? 1000,
  });
}

// ── checkPosition — validasi lokasi GPS ke backend ────────────────────────────
//
// Digunakan oleh BindingPage untuk menampilkan teks keterangan area (misal: "Di dalam radius kantor")
//
// Query GET:
//   mod : 'getPosition'
//   lat : number
//   lon : number
//   acc : number
//
// Response JSON yang diharapkan dari server:
//   Array of strings: ['Di dalam radius kantor (akurasi: 15m)']
//   Atau: ['Di luar radius kantor — Jarak: 1.2 km']
export async function checkPosition(lat, lon, acc) {
  return get({
    mod: 'getPosition',
    lat,
    lon,
    acc,
  });
}

// ── getUserAgent / initial load ──────────────────────────────────────────────
export async function getUserAgent(result, lat, lon, acc) {
  return post({
    mod: 'userAgent',
    uuid: result.uuid,
    auid: result.auid || '',
    device: JSON.stringify(result.device),
    lat,
    lon,
    acc,
  });
}

// ── Check-In / Check-Out ─────────────────────────────────────────────────────
export async function check(pushCiCo) {
  return post({ mod: 'check', ...pushCiCo });
}

// ── Today's attendance log ───────────────────────────────────────────────────
export async function getADay(uuid) {
  const today = new Date();
  return get({
    mod: 'aday',
    uuid,
    sheet: today.getMonth(),
    tahun: today.getFullYear(),
  });
}

// ── Monthly attendance log ───────────────────────────────────────────────────
export async function getAMonth(uuid, month, year, type = '') {
  return get({
    mod: 'amonth',
    uuid,
    sheet: month,
    tahun: year,
    type,
  });
}

// ── Add attendance log ───────────────────────────────────────────────────────
export async function addLog(payload) {
  return post({ action: 'add', ...payload });
}

// ── Edit attendance log ──────────────────────────────────────────────────────
export async function editLog(payload) {
  return post({ action: 'edit', ...payload });
}

// ── Delete today log (aday) ──────────────────────────────────────────────────
export async function deleteLog(uuid, month, year, type, waktu) {
  return get({
    mod: 'adelete',
    uuid,
    sheet: month,
    tahun: year,
    type,
    waktu,
  });
}

// ── Remove pending log ───────────────────────────────────────────────────────
export async function removeLog(uuid, month, year, tanggal, type, waktu) {
  return get({
    mod: 'remove',
    uuid,
    sheet: month,
    tahun: year,
    tanggal,
    type,
    waktu,
  });
}

// ── Ketidakhadiran (Cuti/Izin/Sakit/Off) ────────────────────────────────────
export async function submitKetidakhadiran(pushData) {
  return post({ mod: 'check', ...pushData });
}

// ── Auto Off / Cuti plan ─────────────────────────────────────────────────────
export async function autoLog(payload) {
  return post({ action: 'auto', ...payload });
}

export async function showAuto(uuid) {
  return post({ action: 'show', uuid });
}

// ── Account ──────────────────────────────────────────────────────────────────
export async function updateAkun(uuid, wa, email) {
  return post({ mod: 'updateAkun', uuid, wa, email });
}

export async function getAkunData(uuid) {
  return get({ mod: 'getAkun', uuid });
}
