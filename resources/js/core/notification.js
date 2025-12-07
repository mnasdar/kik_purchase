/**
 * Core - Notification
 * Handler untuk notifikasi menggunakan SweetAlert2
 * 
 * @module core/notification
 */

import Swal from 'sweetalert2';

/**
 * Konfigurasi default untuk SweetAlert
 */
const defaultConfig = {
    customClass: {
        confirmButton: "btn bg-primary text-white w-xs mt-2",
        cancelButton: "btn bg-danger text-white w-xs mt-2",
    },
    buttonsStyling: false,
};

/**
 * Tampilkan notifikasi sukses
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} title - Judul notifikasi (opsional)
 * @param {Object} options - Opsi tambahan untuk SweetAlert
 * @returns {Promise} Promise dari SweetAlert
 * 
 * @example
 * showSuccess('Data berhasil disimpan');
 * showSuccess('Data berhasil disimpan', 'Sukses!');
 */
export function showSuccess(message, title = 'Sukses!', options = {}) {
    return Swal.fire({
        icon: 'success',
        title,
        text: message,
        ...defaultConfig,
        ...options
    });
}

/**
 * Tampilkan notifikasi error
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} title - Judul notifikasi (opsional)
 * @param {Object} options - Opsi tambahan untuk SweetAlert
 * @returns {Promise} Promise dari SweetAlert
 * 
 * @example
 * showError('Terjadi kesalahan');
 * showError('Data tidak ditemukan', 'Error!');
 */
export function showError(message, title = 'Gagal!', options = {}) {
    return Swal.fire({
        icon: 'error',
        title,
        text: message,
        ...defaultConfig,
        ...options
    });
}

/**
 * Tampilkan notifikasi warning
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} title - Judul notifikasi (opsional)
 * @param {Object} options - Opsi tambahan untuk SweetAlert
 * @returns {Promise} Promise dari SweetAlert
 * 
 * @example
 * showWarning('Stok produk hampir habis');
 * showWarning('Data akan dihapus', 'Perhatian!');
 */
export function showWarning(message, title = 'Perhatian!', options = {}) {
    return Swal.fire({
        icon: 'warning',
        title,
        text: message,
        ...defaultConfig,
        ...options
    });
}

/**
 * Tampilkan notifikasi info
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} title - Judul notifikasi (opsional)
 * @param {Object} options - Opsi tambahan untuk SweetAlert
 * @returns {Promise} Promise dari SweetAlert
 * 
 * @example
 * showInfo('Proses sedang berjalan');
 * showInfo('Silakan tunggu', 'Informasi');
 */
export function showInfo(message, title = 'Informasi', options = {}) {
    return Swal.fire({
        icon: 'info',
        title,
        text: message,
        ...defaultConfig,
        ...options
    });
}

/**
 * Tampilkan dialog konfirmasi
 * @param {string} message - Pesan konfirmasi
 * @param {string} title - Judul dialog (opsional)
 * @param {Object} options - Opsi tambahan
 * @returns {Promise<boolean>} Promise yang resolve dengan true jika dikonfirmasi
 * 
 * @example
 * confirmAction('Apakah Anda yakin ingin menghapus data ini?')
 *   .then(confirmed => {
 *     if (confirmed) {
 *       // Lakukan aksi
 *     }
 *   });
 */
export function confirmAction(message, title = 'Apakah Anda yakin?', options = {}) {
    return Swal.fire({
        title,
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, lanjutkan!',
        cancelButtonText: 'Batal',
        customClass: {
            confirmButton: "btn bg-primary text-white w-xs me-2 mt-2",
            cancelButton: "btn bg-danger text-white w-xs mt-2",
        },
        buttonsStyling: false,
        ...options
    }).then(result => result.isConfirmed);
}

/**
 * Tampilkan dialog konfirmasi delete
 * @param {string} itemName - Nama item yang akan dihapus
 * @param {Object} options - Opsi tambahan
 * @returns {Promise<boolean>} Promise yang resolve dengan true jika dikonfirmasi
 * 
 * @example
 * confirmDelete('produk ini')
 *   .then(confirmed => {
 *     if (confirmed) {
 *       // Hapus data
 *     }
 *   });
 */
export function confirmDelete(itemName = 'data ini', options = {}) {
    return Swal.fire({
        title: 'Hapus Data?',
        html: `Apakah Anda yakin ingin menghapus ${itemName}? Tindakan ini tidak dapat dibatalkan.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal',
        customClass: {
            confirmButton: "btn bg-danger text-white w-xs me-2 mt-2",
            cancelButton: "btn bg-secondary text-white w-xs mt-2",
        },
        buttonsStyling: false,
        ...options
    }).then(result => result.isConfirmed);
}

/**
 * Tampilkan loading indicator
 * @param {string} message - Pesan loading
 * @param {string} title - Judul loading (opsional)
 * 
 * @example
 * showLoading('Memproses data...');
 * // Lakukan operasi async
 * hideLoading();
 */
export function showLoading(message = 'Memproses...', title = 'Mohon Tunggu') {
    Swal.fire({
        title,
        text: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

/**
 * Sembunyikan loading indicator
 * 
 * @example
 * showLoading('Memproses...');
 * setTimeout(() => {
 *   hideLoading();
 *   showSuccess('Selesai!');
 * }, 2000);
 */
export function hideLoading() {
    Swal.close();
}

/**
 * Tampilkan toast notification (notifikasi kecil di pojok)
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - Tipe toast: 'success', 'error', 'warning', 'info'
 * @param {number} timer - Durasi tampil (ms)
 * @param {string} position - Posisi toast
 * 
 * @example
 * showToast('Data berhasil disimpan', 'success');
 * showToast('Terjadi kesalahan', 'error', 3000);
 */
export function showToast(message, type = 'success', timer = 2000, position = 'top-end') {
    const Toast = Swal.mixin({
        toast: true,
        position,
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    return Toast.fire({
        icon: type,
        title: message
    });
}

/**
 * Tampilkan dialog dengan input
 * @param {string} title - Judul dialog
 * @param {string} inputLabel - Label untuk input
 * @param {string} inputType - Tipe input: 'text', 'email', 'password', 'number', 'tel', 'textarea'
 * @param {Object} options - Opsi tambahan
 * @returns {Promise<string|null>} Promise yang resolve dengan nilai input atau null jika dibatalkan
 * 
 * @example
 * showInputDialog('Masukkan Nama', 'Nama Produk', 'text')
 *   .then(value => {
 *     if (value) {
 *       console.log('Input:', value);
 *     }
 *   });
 */
export function showInputDialog(title, inputLabel, inputType = 'text', options = {}) {
    return Swal.fire({
        title,
        input: inputType,
        inputLabel,
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Batal',
        ...defaultConfig,
        inputValidator: (value) => {
            if (!value) {
                return 'Field ini wajib diisi!';
            }
        },
        ...options
    }).then(result => {
        if (result.isConfirmed) {
            return result.value;
        }
        return null;
    });
}

/**
 * Tampilkan dialog dengan select/dropdown
 * @param {string} title - Judul dialog
 * @param {Object} options - Object dengan key-value untuk options
 * @param {string} inputLabel - Label untuk select
 * @param {Object} additionalOptions - Opsi tambahan
 * @returns {Promise<string|null>} Promise yang resolve dengan nilai yang dipilih
 * 
 * @example
 * showSelectDialog('Pilih Kategori', {
 *   '1': 'Elektronik',
 *   '2': 'Fashion',
 *   '3': 'Makanan'
 * }, 'Kategori Produk')
 *   .then(value => {
 *     if (value) {
 *       console.log('Selected:', value);
 *     }
 *   });
 */
export function showSelectDialog(title, options, inputLabel = '', additionalOptions = {}) {
    return Swal.fire({
        title,
        input: 'select',
        inputLabel,
        inputOptions: options,
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Batal',
        ...defaultConfig,
        inputValidator: (value) => {
            if (!value) {
                return 'Silakan pilih salah satu!';
            }
        },
        ...additionalOptions
    }).then(result => {
        if (result.isConfirmed) {
            return result.value;
        }
        return null;
    });
}

/**
 * Tampilkan notifikasi dengan timer auto close
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - Tipe: 'success', 'error', 'warning', 'info'
 * @param {number} timer - Durasi tampil (ms)
 * @returns {Promise} Promise dari SweetAlert
 * 
 * @example
 * showTimedNotification('Data berhasil disimpan', 'success', 2000);
 */
export function showTimedNotification(message, type = 'success', timer = 2000) {
    return Swal.fire({
        icon: type,
        title: message,
        timer,
        timerProgressBar: true,
        showConfirmButton: false,
        ...defaultConfig
    });
}

/**
 * Tampilkan notifikasi dengan HTML content
 * @param {string} title - Judul notifikasi
 * @param {string} htmlContent - Konten HTML
 * @param {string} type - Tipe: 'success', 'error', 'warning', 'info'
 * @param {Object} options - Opsi tambahan
 * @returns {Promise} Promise dari SweetAlert
 * 
 * @example
 * showHtmlNotification('Detail Produk', '<p>Nama: <b>Laptop</b></p><p>Harga: <b>Rp 5.000.000</b></p>', 'info');
 */
export function showHtmlNotification(title, htmlContent, type = 'info', options = {}) {
    return Swal.fire({
        icon: type,
        title,
        html: htmlContent,
        ...defaultConfig,
        ...options
    });
}

/**
 * Tampilkan progress bar
 * @param {string} title - Judul
 * @param {number} currentStep - Step saat ini
 * @param {number} totalSteps - Total steps
 * @returns {Promise} Promise dari SweetAlert
 * 
 * @example
 * showProgress('Mengupload File', 3, 5);
 */
export function showProgress(title, currentStep, totalSteps) {
    const percentage = Math.round((currentStep / totalSteps) * 100);
    
    return Swal.fire({
        title,
        html: `
            <div class="progress" style="height: 20px;">
                <div class="progress-bar" role="progressbar" 
                     style="width: ${percentage}%" 
                     aria-valuenow="${percentage}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                    ${percentage}%
                </div>
            </div>
            <p class="mt-2">Step ${currentStep} dari ${totalSteps}</p>
        `,
        showConfirmButton: false,
        allowOutsideClick: false
    });
}
