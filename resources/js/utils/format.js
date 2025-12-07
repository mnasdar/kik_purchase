/**
 * Utils - Format
 * Fungsi-fungsi helper untuk formatting data
 * 
 * @module utils/format
 */

/**
 * Format angka ke format Rupiah
 * @param {number|string} angka - Angka yang akan diformat
 * @returns {string} Format: "1.234.567"
 * 
 * @example
 * formatRupiah(1234567) // "1.234.567"
 * formatRupiah("1234567") // "1.234.567"
 */
export function formatRupiah(angka) {
    if (!angka && angka !== 0) return "0";
    
    const number = typeof angka === 'string' ? parseInt(angka.replace(/[^\d]/g, '')) : angka;
    return new Intl.NumberFormat("id-ID").format(number);
}

/**
 * Format angka ke format Rupiah lengkap dengan prefix "Rp"
 * @param {number|string} angka - Angka yang akan diformat
 * @returns {string} Format: "Rp 1.234.567"
 * 
 * @example
 * formatRupiahLengkap(1234567) // "Rp 1.234.567"
 */
export function formatRupiahLengkap(angka) {
    return `Rp ${formatRupiah(angka)}`;
}

/**
 * Parse string rupiah ke angka
 * @param {string} rupiahString - String rupiah yang akan di-parse
 * @returns {number} Angka hasil parsing
 * 
 * @example
 * parseRupiah("Rp 1.234.567") // 1234567
 * parseRupiah("1.234.567") // 1234567
 */
export function parseRupiah(rupiahString) {
    if (!rupiahString) return 0;
    return parseInt(rupiahString.toString().replace(/[^\d]/g, '')) || 0;
}

/**
 * Format tanggal ke format Indonesia
 * @param {string|Date} tanggal - Tanggal yang akan diformat
 * @param {boolean} withTime - Tampilkan waktu atau tidak
 * @returns {string} Format: "31 Desember 2024" atau "31 Des 2024 14:30"
 * 
 * @example
 * formatTanggal("2024-12-31") // "31 Desember 2024"
 * formatTanggal("2024-12-31 14:30:00", true) // "31 Des 2024 14:30"
 */
export function formatTanggal(tanggal, withTime = false) {
    if (!tanggal) return "-";
    
    const date = new Date(tanggal);
    const options = {
        day: 'numeric',
        month: withTime ? 'short' : 'long',
        year: 'numeric',
        ...(withTime && { hour: '2-digit', minute: '2-digit' })
    };
    
    return new Intl.DateTimeFormat('id-ID', options).format(date);
}

/**
 * Format nomor telepon Indonesia
 * @param {string} nomor - Nomor telepon
 * @returns {string} Format: "0812-3456-7890"
 * 
 * @example
 * formatTelepon("081234567890") // "0812-3456-7890"
 */
export function formatTelepon(nomor) {
    if (!nomor) return "-";
    
    const cleaned = nomor.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{4})(\d{4})(\d{4})$/);
    
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    
    return nomor;
}

/**
 * Format persentase
 * @param {number} angka - Angka yang akan diformat
 * @param {number} desimal - Jumlah angka desimal
 * @returns {string} Format: "12.5%"
 * 
 * @example
 * formatPersentase(12.5) // "12.5%"
 * formatPersentase(12.567, 2) // "12.57%"
 */
export function formatPersentase(angka, desimal = 1) {
    if (!angka && angka !== 0) return "0%";
    return `${angka.toFixed(desimal)}%`;
}

/**
 * Capitalize kata pertama
 * @param {string} text - Text yang akan di-capitalize
 * @returns {string} Text dengan huruf pertama kapital
 * 
 * @example
 * capitalize("hello world") // "Hello world"
 */
export function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitalize setiap kata
 * @param {string} text - Text yang akan di-capitalize
 * @returns {string} Text dengan setiap kata diawali huruf kapital
 * 
 * @example
 * capitalizeWords("hello world") // "Hello World"
 */
export function capitalizeWords(text) {
    if (!text) return "";
    return text.split(' ')
        .map(word => capitalize(word))
        .join(' ');
}

/**
 * Truncate text dengan ellipsis
 * @param {string} text - Text yang akan di-truncate
 * @param {number} maxLength - Panjang maksimal
 * @returns {string} Text yang sudah di-truncate
 * 
 * @example
 * truncate("Lorem ipsum dolor sit amet", 10) // "Lorem ipsu..."
 */
export function truncate(text, maxLength = 50) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}

/**
 * Format ukuran file
 * @param {number} bytes - Ukuran dalam bytes
 * @returns {string} Format: "1.5 MB"
 * 
 * @example
 * formatFileSize(1536000) // "1.5 MB"
 */
export function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format nomor dengan leading zero
 * @param {number} num - Angka yang akan diformat
 * @param {number} length - Panjang total string
 * @returns {string} Format: "001", "042"
 * 
 * @example
 * padNumber(5, 3) // "005"
 * padNumber(42, 3) // "042"
 */
export function padNumber(num, length = 2) {
    return String(num).padStart(length, '0');
}

/**
 * Ekstrak teks dari HTML
 * @param {string} html - HTML string
 * @returns {string} Plain text
 * 
 * @example
 * extractText("<p>Hello <b>World</b></p>") // "Hello World"
 */
export function extractText(html) {
    if (!html) return "";
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
}
