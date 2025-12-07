/**
 * Utils - AJAX
 * Fungsi-fungsi helper untuk AJAX request dengan error handling
 * 
 * @module utils/ajax
 */

import $ from 'jquery';
import { showError, showSuccess } from '../core/notification.js';

/**
 * Konfigurasi default untuk AJAX request
 */
const defaultConfig = {
    showLoader: true,
    showSuccessMessage: false,
    showErrorMessage: true,
    successMessage: 'Operasi berhasil',
    errorMessage: 'Terjadi kesalahan. Silakan coba lagi.',
};

/**
 * GET request dengan error handling
 * @param {string} url - URL endpoint
 * @param {Object} data - Data yang akan dikirim
 * @param {Object} options - Opsi tambahan
 * @returns {Promise} Promise dari AJAX request
 * 
 * @example
 * ajaxGet('/api/produk', { search: 'laptop' })
 *   .then(data => console.log(data))
 *   .catch(error => console.error(error));
 */
export function ajaxGet(url, data = {}, options = {}) {
    const config = { ...defaultConfig, ...options };
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url,
            method: 'GET',
            data,
            beforeSend: function() {
                if (config.beforeSend) config.beforeSend();
            },
            success: function(response) {
                if (config.showSuccessMessage) {
                    showSuccess(config.successMessage);
                }
                resolve(response);
            },
            error: function(xhr) {
                handleAjaxError(xhr, config);
                reject(xhr);
            },
            complete: function() {
                if (config.complete) config.complete();
            }
        });
    });
}

/**
 * POST request dengan error handling
 * @param {string} url - URL endpoint
 * @param {Object|FormData} data - Data yang akan dikirim
 * @param {Object} options - Opsi tambahan
 * @returns {Promise} Promise dari AJAX request
 * 
 * @example
 * ajaxPost('/api/produk', { name: 'Laptop', price: 5000000 })
 *   .then(data => console.log(data))
 *   .catch(error => console.error(error));
 */
export function ajaxPost(url, data = {}, options = {}) {
    const config = { ...defaultConfig, ...options };
    const isFormData = data instanceof FormData;
    
    // Tambahkan CSRF token jika bukan FormData
    if (!isFormData && !data._token) {
        data._token = $('meta[name="csrf-token"]').attr('content');
    } else if (isFormData && !data.has('_token')) {
        data.append('_token', $('meta[name="csrf-token"]').attr('content'));
    }
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url,
            method: 'POST',
            data,
            processData: !isFormData,
            contentType: isFormData ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
            beforeSend: function() {
                if (config.beforeSend) config.beforeSend();
            },
            success: function(response) {
                if (config.showSuccessMessage) {
                    showSuccess(response.message || config.successMessage);
                }
                resolve(response);
            },
            error: function(xhr) {
                handleAjaxError(xhr, config);
                reject(xhr);
            },
            complete: function() {
                if (config.complete) config.complete();
            }
        });
    });
}

/**
 * PUT request dengan error handling
 * @param {string} url - URL endpoint
 * @param {Object|FormData} data - Data yang akan dikirim
 * @param {Object} options - Opsi tambahan
 * @returns {Promise} Promise dari AJAX request
 * 
 * @example
 * ajaxPut('/api/produk/1', { name: 'Laptop Updated' })
 *   .then(data => console.log(data))
 *   .catch(error => console.error(error));
 */
export function ajaxPut(url, data = {}, options = {}) {
    const config = { ...defaultConfig, ...options };
    const isFormData = data instanceof FormData;
    
    // Tambahkan _method untuk Laravel
    if (isFormData) {
        data.append('_method', 'PUT');
        data.append('_token', $('meta[name="csrf-token"]').attr('content'));
    } else {
        data._method = 'PUT';
        data._token = $('meta[name="csrf-token"]').attr('content');
    }
    
    return ajaxPost(url, data, config);
}

/**
 * DELETE request dengan error handling
 * @param {string} url - URL endpoint
 * @param {Object} data - Data yang akan dikirim
 * @param {Object} options - Opsi tambahan
 * @returns {Promise} Promise dari AJAX request
 * 
 * @example
 * ajaxDelete('/api/produk/1')
 *   .then(data => console.log(data))
 *   .catch(error => console.error(error));
 */
export function ajaxDelete(url, data = {}, options = {}) {
    const config = { ...defaultConfig, ...options };
    
    data._method = 'DELETE';
    data._token = $('meta[name="csrf-token"]').attr('content');
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url,
            method: 'POST',
            data,
            beforeSend: function() {
                if (config.beforeSend) config.beforeSend();
            },
            success: function(response) {
                if (config.showSuccessMessage) {
                    showSuccess(response.message || config.successMessage);
                }
                resolve(response);
            },
            error: function(xhr) {
                handleAjaxError(xhr, config);
                reject(xhr);
            },
            complete: function() {
                if (config.complete) config.complete();
            }
        });
    });
}

/**
 * Handle AJAX error dengan menampilkan pesan yang sesuai
 * @param {Object} xhr - XMLHttpRequest object
 * @param {Object} config - Konfigurasi
 */
function handleAjaxError(xhr, config) {
    if (!config.showErrorMessage) return;
    
    let errorMessage = config.errorMessage;
    
    // Handle validation errors (422)
    if (xhr.status === 422 && xhr.responseJSON?.errors) {
        const errors = xhr.responseJSON.errors;
        const firstError = Object.values(errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
    }
    // Handle other errors with message
    else if (xhr.responseJSON?.message) {
        errorMessage = xhr.responseJSON.message;
    }
    // Handle network errors
    else if (xhr.status === 0) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    }
    // Handle server errors
    else if (xhr.status >= 500) {
        errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
    }
    // Handle unauthorized
    else if (xhr.status === 401) {
        errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
    }
    // Handle forbidden
    else if (xhr.status === 403) {
        errorMessage = 'Anda tidak memiliki akses untuk melakukan operasi ini.';
    }
    // Handle not found
    else if (xhr.status === 404) {
        errorMessage = 'Data tidak ditemukan.';
    }
    
    showError(errorMessage);
}

/**
 * Upload file dengan progress
 * @param {string} url - URL endpoint
 * @param {FormData} formData - FormData berisi file
 * @param {Function} onProgress - Callback untuk progress
 * @param {Object} options - Opsi tambahan
 * @returns {Promise} Promise dari AJAX request
 * 
 * @example
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * 
 * ajaxUpload('/api/upload', formData, (percent) => {
 *   console.log(`Upload progress: ${percent}%`);
 * }).then(data => console.log('Upload complete'));
 */
export function ajaxUpload(url, formData, onProgress = null, options = {}) {
    const config = { ...defaultConfig, ...options };
    
    if (!formData.has('_token')) {
        formData.append('_token', $('meta[name="csrf-token"]').attr('content'));
    }
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                
                if (onProgress) {
                    xhr.upload.addEventListener('progress', function(e) {
                        if (e.lengthComputable) {
                            const percent = Math.round((e.loaded / e.total) * 100);
                            onProgress(percent);
                        }
                    }, false);
                }
                
                return xhr;
            },
            beforeSend: function() {
                if (config.beforeSend) config.beforeSend();
            },
            success: function(response) {
                if (config.showSuccessMessage) {
                    showSuccess(response.message || 'File berhasil diupload');
                }
                resolve(response);
            },
            error: function(xhr) {
                handleAjaxError(xhr, config);
                reject(xhr);
            },
            complete: function() {
                if (config.complete) config.complete();
            }
        });
    });
}

/**
 * Batch request (multiple AJAX calls)
 * @param {Array<Promise>} requests - Array of AJAX promises
 * @returns {Promise} Promise.all dari semua request
 * 
 * @example
 * ajaxBatch([
 *   ajaxGet('/api/produk'),
 *   ajaxGet('/api/kategori'),
 *   ajaxGet('/api/satuan')
 * ]).then(([produk, kategori, satuan]) => {
 *   console.log('All data loaded');
 * });
 */
export function ajaxBatch(requests) {
    return Promise.all(requests);
}

/**
 * Retry AJAX request jika gagal
 * @param {Function} ajaxFunction - Fungsi AJAX yang akan di-retry
 * @param {number} maxRetries - Maksimal retry
 * @param {number} delay - Delay antar retry (ms)
 * @returns {Promise} Promise dari AJAX request
 * 
 * @example
 * ajaxRetry(() => ajaxGet('/api/produk'), 3, 1000)
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Failed after 3 retries'));
 */
export function ajaxRetry(ajaxFunction, maxRetries = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        let retries = 0;
        
        function attempt() {
            ajaxFunction()
                .then(resolve)
                .catch(error => {
                    retries++;
                    if (retries < maxRetries) {
                        setTimeout(attempt, delay);
                    } else {
                        reject(error);
                    }
                });
        }
        
        attempt();
    });
}

/**
 * Cancel AJAX request
 * @returns {Object} Object dengan method abort
 * 
 * @example
 * const request = ajaxCancelable('/api/produk');
 * request.promise.then(data => console.log(data));
 * 
 * // Cancel request
 * request.abort();
 */
export function ajaxCancelable(url, data = {}, options = {}) {
    let xhr;
    
    const promise = new Promise((resolve, reject) => {
        xhr = $.ajax({
            url,
            method: 'GET',
            data,
            success: resolve,
            error: reject
        });
    });
    
    return {
        promise,
        abort: () => xhr && xhr.abort()
    };
}
