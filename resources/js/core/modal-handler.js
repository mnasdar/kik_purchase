/**
 * Core - Modal Handler
 * Handler untuk modal (open, close, populate data)
 * 
 * @module core/modal-handler
 */

import $ from 'jquery';

/**
 * Buka modal
 * @param {string} modalSelector - Selector untuk modal
 * 
 * @example
 * openModal('#myModal');
 */
export function openModal(modalSelector) {
    const modal = $(modalSelector);
    if (!modal.length) return;

    modal.removeClass('hidden').addClass('flex');
    $('body').addClass('overflow-hidden');
}

/**
 * Tutup modal
 * @param {string} modalSelector - Selector untuk modal
 * 
 * @example
 * closeModal('#myModal');
 */
export function closeModal(modalSelector) {
    const modal = $(modalSelector);
    if (!modal.length) return;

    modal.addClass('hidden').removeClass('flex');
    $('body').removeClass('overflow-hidden');
}

/**
 * Toggle modal (buka/tutup)
 * @param {string} modalSelector - Selector untuk modal
 * 
 * @example
 * toggleModal('#myModal');
 */
export function toggleModal(modalSelector) {
    const modal = $(modalSelector);
    if (!modal.length) return;

    if (modal.hasClass('hidden')) {
        openModal(modalSelector);
    } else {
        closeModal(modalSelector);
    }
}

/**
 * Inisialisasi modal dengan event handlers
 * @param {Object} config - Konfigurasi modal
 * @param {string} config.modalSelector - Selector untuk modal
 * @param {string} config.openButtonSelector - Selector untuk tombol buka
 * @param {string} config.closeButtonSelector - Selector untuk tombol tutup
 * @param {Function} config.onOpen - Callback saat modal dibuka
 * @param {Function} config.onClose - Callback saat modal ditutup
 * @param {boolean} config.closeOnBackdrop - Tutup saat klik backdrop
 * @param {boolean} config.closeOnEscape - Tutup saat tekan ESC
 * 
 * @example
 * initModal({
 *   modalSelector: '#myModal',
 *   openButtonSelector: '.btn-open-modal',
 *   closeButtonSelector: '.btn-close-modal',
 *   onOpen: () => console.log('Modal opened'),
 *   closeOnBackdrop: true
 * });
 */
export function initModal(config = {}) {
    const {
        modalSelector,
        openButtonSelector,
        closeButtonSelector = '[data-fc-dismiss]',
        onOpen,
        onClose,
        closeOnBackdrop = true,
        closeOnEscape = true
    } = config;

    const modal = $(modalSelector);
    if (!modal.length) return;

    // Event: Buka modal
    if (openButtonSelector) {
        $(document).on('click', openButtonSelector, function (e) {
            e.preventDefault();
            openModal(modalSelector);
            if (onOpen) onOpen();
        });
    }

    // Event: Tutup modal via tombol
    $(document).on('click', closeButtonSelector, function () {
        const targetModal = $(this).closest('.modal');
        if (targetModal.length) {
            closeModal(`#${targetModal.attr('id')}`);
            if (onClose) onClose();
        }
    });

    // Event: Tutup modal saat klik backdrop
    if (closeOnBackdrop) {
        modal.on('click', function (e) {
            if ($(e.target).is(modal)) {
                closeModal(modalSelector);
                if (onClose) onClose();
            }
        });
    }

    // Event: Tutup modal saat tekan ESC
    if (closeOnEscape) {
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && !modal.hasClass('hidden')) {
                closeModal(modalSelector);
                if (onClose) onClose();
            }
        });
    }
}

/**
 * Populate data ke modal form
 * @param {string} modalSelector - Selector untuk modal
 * @param {Object} data - Data yang akan di-populate
 * 
 * @example
 * populateModal('#editModal', {
 *   name: 'Laptop',
 *   price: 5000000,
 *   category_id: 1
 * });
 */
export function populateModal(modalSelector, data) {
    const modal = $(modalSelector);
    if (!modal.length) return;

    Object.keys(data).forEach(key => {
        const input = modal.find(`[name="${key}"]`);
        
        if (input.length) {
            const inputType = input.attr('type');
            const tagName = input.prop('tagName').toLowerCase();

            if (inputType === 'checkbox') {
                input.prop('checked', !!data[key]);
            } else if (inputType === 'radio') {
                input.filter(`[value="${data[key]}"]`).prop('checked', true);
            } else if (tagName === 'select') {
                input.val(data[key]).trigger('change');
            } else {
                input.val(data[key]);
            }
        }

        // Update preview image jika ada
        if (key === 'image' || key === 'gambar') {
            const preview = modal.find(`img[id*="preview"]`);
            if (preview.length && data[key]) {
                preview.attr('src', data[key]).removeClass('hidden');
            }
        }
    });
}

/**
 * Reset modal form
 * @param {string} modalSelector - Selector untuk modal
 * 
 * @example
 * resetModal('#createModal');
 */
export function resetModal(modalSelector) {
    const modal = $(modalSelector);
    if (!modal.length) return;

    // Reset form jika ada
    const form = modal.find('form');
    if (form.length) {
        form[0].reset();
        form.find('p[id^="error-"]').text('');
    }

    // Hide preview images
    modal.find('img[id*="preview"]').addClass('hidden');

    // Reset select2 jika ada
    modal.find('select').trigger('change');
}

/**
 * Inisialisasi modal create
 * @param {Object} config - Konfigurasi modal
 * @param {string} config.modalSelector - Selector untuk modal
 * @param {string} config.openButtonSelector - Selector untuk tombol buka
 * @param {string} config.formSelector - Selector untuk form
 * @param {Function} config.onSubmit - Callback saat submit
 * 
 * @example
 * initCreateModal({
 *   modalSelector: '#createModal',
 *   openButtonSelector: '.btn-create',
 *   formSelector: '#form-create',
 *   onSubmit: (formData) => {
 *     // Handle submit
 *   }
 * });
 */
export function initCreateModal(config = {}) {
    const {
        modalSelector,
        openButtonSelector,
        formSelector,
        onSubmit
    } = config;

    // Inisialisasi modal
    initModal({
        modalSelector,
        openButtonSelector,
        onOpen: () => {
            resetModal(modalSelector);
        }
    });

    // Handle form submit
    if (formSelector && onSubmit) {
        $(formSelector).on('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            onSubmit(formData);
        });
    }
}

/**
 * Inisialisasi modal edit
 * @param {Object} config - Konfigurasi modal
 * @param {string} config.modalSelector - Selector untuk modal
 * @param {string} config.openButtonSelector - Selector untuk tombol buka
 * @param {string} config.formSelector - Selector untuk form
 * @param {Function} config.onSubmit - Callback saat submit
 * @param {Function} config.getData - Fungsi untuk mendapatkan data
 * 
 * @example
 * initEditModal({
 *   modalSelector: '#editModal',
 *   openButtonSelector: '.btn-edit',
 *   formSelector: '#form-edit',
 *   getData: (button) => {
 *     return JSON.parse(button.attr('data-item'));
 *   },
 *   onSubmit: (formData) => {
 *     // Handle submit
 *   }
 * });
 */
export function initEditModal(config = {}) {
    const {
        modalSelector,
        openButtonSelector,
        formSelector,
        onSubmit,
        getData
    } = config;

    // Event: Buka modal dan populate data
    $(document).on('click', openButtonSelector, function (e) {
        e.preventDefault();
        
        // Get data
        let data = {};
        if (getData) {
            data = getData($(this));
        } else if ($(this).data('item')) {
            data = $(this).data('item');
        }

        // Populate dan buka modal
        populateModal(modalSelector, data);
        openModal(modalSelector);
    });

    // Inisialisasi modal
    initModal({
        modalSelector,
        onClose: () => {
            resetModal(modalSelector);
        }
    });

    // Handle form submit
    if (formSelector && onSubmit) {
        $(formSelector).on('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            onSubmit(formData);
        });
    }
}

/**
 * Inisialisasi modal konfirmasi
 * @param {Object} config - Konfigurasi modal
 * @param {string} config.modalSelector - Selector untuk modal
 * @param {string} config.triggerSelector - Selector untuk trigger button
 * @param {string} config.confirmButtonSelector - Selector untuk tombol konfirmasi
 * @param {Function} config.onConfirm - Callback saat dikonfirmasi
 * @param {Function} config.getMessage - Fungsi untuk mendapatkan pesan
 * 
 * @example
 * initConfirmModal({
 *   modalSelector: '#confirmModal',
 *   triggerSelector: '.btn-delete',
 *   confirmButtonSelector: '#btn-confirm-delete',
 *   getMessage: (button) => {
 *     return `Hapus ${button.data('name')}?`;
 *   },
 *   onConfirm: (button) => {
 *     // Handle delete
 *   }
 * });
 */
export function initConfirmModal(config = {}) {
    const {
        modalSelector,
        triggerSelector,
        confirmButtonSelector,
        onConfirm,
        getMessage
    } = config;

    let currentTrigger = null;

    // Event: Buka modal konfirmasi
    $(document).on('click', triggerSelector, function (e) {
        e.preventDefault();
        currentTrigger = $(this);

        // Set pesan jika ada
        if (getMessage) {
            const message = getMessage(currentTrigger);
            $(modalSelector).find('.modal-message').text(message);
        }

        openModal(modalSelector);
    });

    // Event: Konfirmasi
    $(document).on('click', confirmButtonSelector, function () {
        if (onConfirm && currentTrigger) {
            onConfirm(currentTrigger);
        }
        closeModal(modalSelector);
        currentTrigger = null;
    });

    // Inisialisasi modal
    initModal({ modalSelector });
}

/**
 * Show loading di modal
 * @param {string} modalSelector - Selector untuk modal
 * @param {string} message - Pesan loading
 * 
 * @example
 * showModalLoading('#myModal', 'Memproses data...');
 */
export function showModalLoading(modalSelector, message = 'Memproses...') {
    const modal = $(modalSelector);
    if (!modal.length) return;

    const loadingHtml = `
        <div class="modal-loading absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div class="text-center">
                <div class="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2 text-gray-600">${message}</p>
            </div>
        </div>
    `;

    modal.find('.modal-content').css('position', 'relative').append(loadingHtml);
}

/**
 * Hide loading di modal
 * @param {string} modalSelector - Selector untuk modal
 * 
 * @example
 * hideModalLoading('#myModal');
 */
export function hideModalLoading(modalSelector) {
    const modal = $(modalSelector);
    if (!modal.length) return;

    modal.find('.modal-loading').remove();
}
