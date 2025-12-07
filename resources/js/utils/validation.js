/**
 * Utils - Validation
 * Fungsi-fungsi helper untuk validasi input
 * 
 * @module utils/validation
 */

/**
 * Validasi email
 * @param {string} email - Email yang akan divalidasi
 * @returns {boolean} True jika valid
 * 
 * @example
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid-email") // false
 */
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validasi nomor telepon Indonesia
 * @param {string} phone - Nomor telepon yang akan divalidasi
 * @returns {boolean} True jika valid
 * 
 * @example
 * isValidPhone("081234567890") // true
 * isValidPhone("08123") // false
 */
export function isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return /^(08|62)\d{8,11}$/.test(cleaned);
}

/**
 * Validasi URL
 * @param {string} url - URL yang akan divalidasi
 * @returns {boolean} True jika valid
 * 
 * @example
 * isValidUrl("https://example.com") // true
 * isValidUrl("not-a-url") // false
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validasi angka positif
 * @param {number|string} value - Nilai yang akan divalidasi
 * @returns {boolean} True jika valid
 * 
 * @example
 * isPositiveNumber(10) // true
 * isPositiveNumber(-5) // false
 * isPositiveNumber("abc") // false
 */
export function isPositiveNumber(value) {
    const num = Number(value);
    return !isNaN(num) && num > 0;
}

/**
 * Validasi angka dalam range
 * @param {number} value - Nilai yang akan divalidasi
 * @param {number} min - Nilai minimum
 * @param {number} max - Nilai maximum
 * @returns {boolean} True jika valid
 * 
 * @example
 * isInRange(5, 1, 10) // true
 * isInRange(15, 1, 10) // false
 */
export function isInRange(value, min, max) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validasi panjang string
 * @param {string} str - String yang akan divalidasi
 * @param {number} min - Panjang minimum
 * @param {number} max - Panjang maximum
 * @returns {boolean} True jika valid
 * 
 * @example
 * isValidLength("hello", 3, 10) // true
 * isValidLength("hi", 3, 10) // false
 */
export function isValidLength(str, min, max) {
    const length = str ? str.length : 0;
    return length >= min && length <= max;
}

/**
 * Validasi password (minimal 8 karakter, ada huruf dan angka)
 * @param {string} password - Password yang akan divalidasi
 * @returns {boolean} True jika valid
 * 
 * @example
 * isValidPassword("Pass123") // false (kurang dari 8)
 * isValidPassword("Password123") // true
 */
export function isValidPassword(password) {
    if (!password || password.length < 8) return false;
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return hasLetter && hasNumber;
}

/**
 * Validasi file extension
 * @param {string} filename - Nama file
 * @param {Array<string>} allowedExtensions - Extension yang diizinkan
 * @returns {boolean} True jika valid
 * 
 * @example
 * isValidFileExtension("image.jpg", ["jpg", "png"]) // true
 * isValidFileExtension("doc.pdf", ["jpg", "png"]) // false
 */
export function isValidFileExtension(filename, allowedExtensions) {
    if (!filename) return false;
    
    const ext = filename.split('.').pop().toLowerCase();
    return allowedExtensions.map(e => e.toLowerCase()).includes(ext);
}

/**
 * Validasi ukuran file
 * @param {number} fileSize - Ukuran file dalam bytes
 * @param {number} maxSizeMB - Ukuran maksimal dalam MB
 * @returns {boolean} True jika valid
 * 
 * @example
 * isValidFileSize(1048576, 2) // true (1MB, max 2MB)
 * isValidFileSize(3145728, 2) // false (3MB, max 2MB)
 */
export function isValidFileSize(fileSize, maxSizeMB) {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return fileSize <= maxBytes;
}

/**
 * Validasi format tanggal (YYYY-MM-DD)
 * @param {string} date - Tanggal yang akan divalidasi
 * @returns {boolean} True jika valid
 * 
 * @example
 * isValidDate("2024-12-31") // true
 * isValidDate("31-12-2024") // false
 */
export function isValidDate(date) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
}

/**
 * Validasi NIK (Nomor Induk Kependudukan)
 * @param {string} nik - NIK yang akan divalidasi
 * @returns {boolean} True jika valid (16 digit)
 * 
 * @example
 * isValidNIK("1234567890123456") // true
 * isValidNIK("12345") // false
 */
export function isValidNIK(nik) {
    return /^\d{16}$/.test(nik);
}

/**
 * Validasi NPWP
 * @param {string} npwp - NPWP yang akan divalidasi
 * @returns {boolean} True jika valid (15 digit)
 * 
 * @example
 * isValidNPWP("123456789012345") // true
 * isValidNPWP("12345") // false
 */
export function isValidNPWP(npwp) {
    const cleaned = npwp.replace(/\D/g, '');
    return /^\d{15}$/.test(cleaned);
}

/**
 * Validasi form field kosong
 * @param {string|number} value - Nilai yang akan divalidasi
 * @returns {boolean} True jika tidak kosong
 * 
 * @example
 * isNotEmpty("hello") // true
 * isNotEmpty("") // false
 * isNotEmpty(null) // false
 */
export function isNotEmpty(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
}

/**
 * Validasi hanya huruf
 * @param {string} str - String yang akan divalidasi
 * @returns {boolean} True jika hanya huruf
 * 
 * @example
 * isAlpha("Hello") // true
 * isAlpha("Hello123") // false
 */
export function isAlpha(str) {
    return /^[a-zA-Z\s]+$/.test(str);
}

/**
 * Validasi hanya angka
 * @param {string} str - String yang akan divalidasi
 * @returns {boolean} True jika hanya angka
 * 
 * @example
 * isNumeric("12345") // true
 * isNumeric("123abc") // false
 */
export function isNumeric(str) {
    return /^\d+$/.test(str);
}

/**
 * Validasi alphanumeric
 * @param {string} str - String yang akan divalidasi
 * @returns {boolean} True jika alphanumeric
 * 
 * @example
 * isAlphanumeric("Hello123") // true
 * isAlphanumeric("Hello@123") // false
 */
export function isAlphanumeric(str) {
    return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Sanitize input untuk mencegah XSS
 * @param {string} str - String yang akan di-sanitize
 * @returns {string} String yang sudah di-sanitize
 * 
 * @example
 * sanitizeInput("<script>alert('xss')</script>") // "<script>alert('xss')</script>"
 */
export function sanitizeInput(str) {
    if (!str) return "";
    
    const map = {
        '&': '&amp;',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    
    return str.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Validasi multiple fields sekaligus
 * @param {Object} fields - Object berisi field dan rules
 * @returns {Object} Object berisi hasil validasi dan error messages
 * 
 * @example
 * validateFields({
 *   email: { value: "test@example.com", rules: ["required", "email"] },
 *   phone: { value: "081234567890", rules: ["required", "phone"] }
 * })
 */
export function validateFields(fields) {
    const errors = {};
    let isValid = true;
    
    Object.keys(fields).forEach(fieldName => {
        const field = fields[fieldName];
        const { value, rules } = field;
        
        rules.forEach(rule => {
            if (rule === 'required' && !isNotEmpty(value)) {
                errors[fieldName] = 'Field ini wajib diisi';
                isValid = false;
            } else if (rule === 'email' && value && !isValidEmail(value)) {
                errors[fieldName] = 'Format email tidak valid';
                isValid = false;
            } else if (rule === 'phone' && value && !isValidPhone(value)) {
                errors[fieldName] = 'Format nomor telepon tidak valid';
                isValid = false;
            } else if (rule === 'numeric' && value && !isNumeric(value)) {
                errors[fieldName] = 'Hanya boleh berisi angka';
                isValid = false;
            }
        });
    });
    
    return { isValid, errors };
}
