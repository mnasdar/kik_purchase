/**
 * Core - Form Handler
 * Handler untuk form CRUD (Create, Read, Update, Delete)
 *
 * @module core/form-handler
 */

import $ from "jquery";
import { route } from "ziggy-js";
import {
    confirmAction,
    confirmDelete,
    showSuccess,
    showError,
    showWarning,
} from "./notification.js";

/**
 * Inisialisasi form create
 * @param {Object} config - Konfigurasi form
 * @param {string} config.formSelector - Selector untuk form
 * @param {Function} config.onSuccess - Callback saat berhasil
 * @param {Function} config.onError - Callback saat error
 * @param {Function} config.beforeSubmit - Callback sebelum submit
 * @param {string} config.confirmMessage - Pesan konfirmasi
 * @param {string} config.successMessage - Pesan sukses
 *
 * @example
 * initCreateForm({
 *   formSelector: '#form-create-produk',
 *   onSuccess: (response) => {
 *     window.location.href = response.redirect;
 *   }
 * });
 */
export function initCreateForm(config = {}) {
    const {
        formSelector,
        onSuccess,
        onError,
        beforeSubmit,
        confirmMessage = "Data akan disimpan ke sistem.",
        successMessage = "Data berhasil disimpan.",
    } = config;

    const form = $(formSelector);
    if (!form.length) return;

    const submitBtn = form.find('button[type="submit"]');
    const loader = submitBtn.find(".loader");
    const submitText = submitBtn.find("span:last");

    // Simpan data awal form
    const initialFormData = new FormData(form[0]);
    const initialSnapshot = snapshotFormData(initialFormData);

    // Deteksi perubahan pada form
    form.on("input change", "input, select, textarea", function () {
        const currentFormData = new FormData(form[0]);
        const currentSnapshot = snapshotFormData(currentFormData);
        submitBtn.prop("disabled", currentSnapshot === initialSnapshot);
    });

    // Disable tombol submit saat load pertama
    submitBtn.prop("disabled", true);

    // Handle submit
    form.on("submit", function (e) {
        e.preventDefault();

        // Callback sebelum submit
        if (beforeSubmit && !beforeSubmit()) {
            return;
        }

        const url = form.attr("action");
        const method = form.attr("method") || "POST";
        const formData = new FormData(this);

        // Tampilkan konfirmasi
        confirmAction(confirmMessage, "Apakah Anda yakin?").then(
            (confirmed) => {
                if (!confirmed) return;

                // Bersihkan error sebelumnya
                form.find('p[id^="error-"]').text("");

                // Tampilkan loader
                if (loader.length) loader.removeClass("hidden");
                if (submitText.length) submitText.addClass("opacity-50");
                submitBtn.prop("disabled", true);

                // Kirim data via AJAX
                $.ajax({
                    url,
                    method,
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (response) {
                        showSuccess(response.message || successMessage).then(
                            () => {
                                if (onSuccess) {
                                    onSuccess(response);
                                } else if (response.redirect) {
                                    window.location.href = response.redirect;
                                }
                            }
                        );
                    },
                    error: function (xhr) {
                        handleFormError(xhr, form);
                        if (onError) onError(xhr);
                    },
                    complete: function () {
                        if (loader.length) loader.addClass("hidden");
                        if (submitText.length)
                            submitText.removeClass("opacity-50");
                        submitBtn.prop("disabled", false);
                    },
                });
            }
        );
    });

    // Handle cancel button
    form.find("#btn-cancel, .btn-cancel").on("click", function () {
        const url = $(this).data("url");
        if (url) {
            window.location.href = url;
        }
    });
}

/**
 * Inisialisasi form create dalam modal
 * @param {Object} config - Konfigurasi form
 * @param {string} config.formSelector - Selector untuk form
 * @param {string} config.modalSelector - Selector untuk modal
 * @param {string} config.triggerSelector - Selector untuk tombol trigger modal (misalnya '[data-fc-target="addModal"]')
 * @param {Function} config.onSuccess - Callback saat berhasil
 * @param {Function} config.onError - Callback saat error
 * @param {Function} config.beforeSubmit - Callback sebelum submit
 * @param {string} config.confirmMessage - Pesan konfirmasi
 * @param {string} config.successMessage - Pesan sukses
 *
 * @example
 * initModalCreateForm({
 *   formSelector: '#addItemForm',
 *   modalSelector: '#addModal',
 *   triggerSelector: '[data-fc-target="addModal"]',
 *   onSuccess: (response) => {
 *     $('#addModal').addClass('hidden'); // Hide modal
 *     location.reload();
 *   }
 * });
 */
export function initModalCreateForm(config = {}) {
    const {
        formSelector,
        modalSelector,
        triggerSelector,
        onSuccess,
        onError,
        beforeSubmit,
        confirmMessage = "Data baru akan disimpan.",
        successMessage = "Data berhasil dibuat.",
    } = config;

    const form = $(formSelector);
    const modal = $(modalSelector);
    if (!form.length || !modal.length) return;

    const submitBtn = form.find('button[type="submit"]');
    const loader = submitBtn.find(".loader");
    const submitText = submitBtn.find("span:last");

    // Handle trigger button: Tampilkan modal menggunakan event delegation
    $(document).on("click", triggerSelector, function () {
        // Reset form saat modal dibuka
        form[0].reset();
        form.find('p[id^="error-"]').text("");
        // Tampilkan modal (gunakan class hidden untuk fc-modal)
        modal.removeClass("hidden");
    });

    // Reset form saat modal dibuka (jika belum diisi)
    modal.on("show.bs.modal", function () {
        if (!form.serialize()) {
            form.find('p[id^="error-"]').text("");
        }
    });

    // Pencegahan close modal saat klik di luar (overlay)
    modal.on("click", function (e) {
        if (e.target === this) {
            e.preventDefault();
            e.stopPropagation();
            // Tidak melakukan apa-apa, sehingga modal tidak tertutup
        }
    });

    // Simpan data awal form
    const initialFormData = new FormData(form[0]);
    const initialSnapshot = snapshotFormData(initialFormData);

    // Deteksi perubahan pada form
    form.on("input change", "input, select, textarea", function () {
        const currentFormData = new FormData(form[0]);
        const currentSnapshot = snapshotFormData(currentFormData);
        submitBtn.prop("disabled", currentSnapshot === initialSnapshot);
    });

    // Handle submit
    form.on("submit", function (e) {
        e.preventDefault();

        // Callback sebelum submit
        if (beforeSubmit && !beforeSubmit()) {
            return;
        }

        const url = form.attr("action");
        const method = form.attr("method") || "POST";
        const formData = new FormData(this);

        // Tampilkan konfirmasi
        confirmAction(confirmMessage, "Apakah Anda yakin?").then(
            (confirmed) => {
                if (!confirmed) return;

                // Bersihkan error
                form.find('p[id^="error-"]').text("");

                // Tampilkan loading
                if (loader.length) loader.removeClass("hidden");
                if (submitText.length) submitText.addClass("opacity-50");
                submitBtn.prop("disabled", true);

                $.ajax({
                    url,
                    method,
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        showSuccess(response.message || successMessage).then(
                            () => {
                                modal.addClass("hidden"); // Hide modal
                                if (onSuccess) {
                                    onSuccess(response);
                                } else if (response.redirect) {
                                    window.location.href = response.redirect;
                                }
                            }
                        );
                    },
                    error: function (xhr) {
                        handleFormError(xhr, form);
                        if (onError) onError(xhr);
                    },
                    complete: function () {
                        if (loader.length) loader.addClass("hidden");
                        if (submitText.length)
                            submitText.removeClass("opacity-50");
                        submitBtn.prop("disabled", false);
                    },
                });
            }
        );
    });
}

/**
 * Inisialisasi form update
 * @param {Object} config - Konfigurasi form
 * @param {string} config.formSelector - Selector untuk form
 * @param {Function} config.onSuccess - Callback saat berhasil
 * @param {Function} config.onError - Callback saat error
 * @param {Function} config.beforeSubmit - Callback sebelum submit
 * @param {string} config.confirmMessage - Pesan konfirmasi
 * @param {string} config.successMessage - Pesan sukses
 *
 * @example
 * initUpdateForm({
 *   formSelector: '#form-update-produk',
 *   onSuccess: (response) => {
 *     window.location.href = response.redirect;
 *   }
 * });
 */
export function initUpdateForm(config = {}) {
    const {
        formSelector,
        onSuccess,
        onError,
        beforeSubmit,
        confirmMessage = "Perubahan akan disimpan.",
        successMessage = "Data berhasil diperbarui.",
    } = config;

    const form = $(formSelector);
    if (!form.length) return;

    const submitBtn = form.find('button[type="submit"]');
    const loader = submitBtn.find(".loader");
    const submitText = submitBtn.find("span:last");

    // Simpan data awal
    const initialData = form.serialize();
    let fileChanged = false;

    // Fungsi cek perubahan
    function checkChanges() {
        const currentData = form.serialize();
        submitBtn.prop("disabled", currentData === initialData && !fileChanged);
    }

    // Deteksi perubahan field text/select/textarea
    form.on(
        "input change",
        "input:not([type=file]), select, textarea",
        checkChanges
    );

    // Deteksi perubahan file
    form.find('input[type="file"]').on("change", function () {
        const file = this.files[0];
        if (file) {
            fileChanged = true;

            // Preview image jika ada
            const previewId = $(this).data("preview");
            if (previewId) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    $(`#${previewId}`)
                        .attr("src", e.target.result)
                        .removeClass("hidden");
                };
                reader.readAsDataURL(file);
            }
        } else {
            fileChanged = false;
        }
        checkChanges();
    });

    // Disable tombol update saat load pertama
    submitBtn.prop("disabled", true);

    // Handle submit
    form.on("submit", function (e) {
        e.preventDefault();

        // Callback sebelum submit
        if (beforeSubmit && !beforeSubmit()) {
            return;
        }

        const url = form.attr("action");
        const method = form.attr("method") || "POST";
        const formData = new FormData(this);

        // Tampilkan konfirmasi
        confirmAction(confirmMessage, "Apakah Anda yakin?").then(
            (confirmed) => {
                if (!confirmed) return;

                // Bersihkan error
                form.find('p[id^="error-"]').text("");

                // Tampilkan loading
                if (loader.length) loader.removeClass("hidden");
                if (submitText.length) submitText.addClass("opacity-50");
                submitBtn.prop("disabled", true);

                $.ajax({
                    url,
                    method,
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        showSuccess(response.message || successMessage).then(
                            () => {
                                if (onSuccess) {
                                    onSuccess(response);
                                } else if (response.redirect) {
                                    window.location.href = response.redirect;
                                }
                            }
                        );
                    },
                    error: function (xhr) {
                        handleFormError(xhr, form);
                        if (onError) onError(xhr);
                    },
                    complete: function () {
                        if (loader.length) loader.addClass("hidden");
                        if (submitText.length)
                            submitText.removeClass("opacity-50");
                        submitBtn.prop("disabled", false);
                    },
                });
            }
        );
    });

    // Handle cancel button
    form.find("#btn-cancel, .btn-cancel").on("click", function () {
        const url = $(this).data("url");
        if (url) {
            window.location.href = url;
        }
    });
}

/**
 * Inisialisasi form update dalam modal
 * @param {Object} config - Konfigurasi form
 * @param {string} config.formSelector - Selector untuk form
 * @param {string} config.modalSelector - Selector untuk modal
 * @param {string} config.resourceName - Nama resource (misalnya 'produk' atau 'satuan') untuk route edit
 * @param {Array} config.prefixes - Array prefix untuk route (misalnya ['GUD001'] atau [])
 * @param {Function} config.onSuccess - Callback saat berhasil
 * @param {Function} config.onError - Callback saat error
 * @param {Function} config.beforeSubmit - Callback sebelum submit
 * @param {string} config.confirmMessage - Pesan konfirmasi
 * @param {string} config.successMessage - Pesan sukses
 *
 * @example
 * initModalUpdateForm({
 *   formSelector: '#form-update-satuan',
 *   modalSelector: '#updateModal',
 *   resourceName: 'satuan',
 *   prefixes: ['GUD001'],
 *   onSuccess: (response) => {
 *     $('#updateModal').addClass('hidden'); // Hide modal
 *     location.reload();
 *   }
 * });
 */
export function initModalUpdateForm(config = {}) {
    const {
        formSelector,
        modalSelector,
        resourceName,
        prefixes = [], // Array prefix, misalnya ['GUD001'] atau []
        onSuccess,
        onError,
        beforeSubmit,
        confirmMessage = "Perubahan akan disimpan.",
        successMessage = "Data berhasil diperbarui.",
    } = config;

    const form = $(formSelector);
    const modal = $(modalSelector);
    if (!form.length || !modal.length) return;

    const submitBtn = form.find('button[type="submit"]');
    const loader = submitBtn.find(".loader");
    const submitText = submitBtn.find("span:last");

    // Simpan data awal
    let initialData = form.serialize();
    let fileChanged = false;

    // Fungsi cek perubahan
    function checkChanges() {
        const currentData = form.serialize();
        submitBtn.prop("disabled", currentData === initialData && !fileChanged);
    }

    // Deteksi perubahan field text/select/textarea
    form.on(
        "input change",
        "input:not([type=file]), select, textarea",
        checkChanges
    );

    // Deteksi perubahan file
    form.find('input[type="file"]').on("change", function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const previewImg = form.find("#previewImg");
                previewImg.attr("src", e.target.result).removeClass("hidden");
                form.find("#imagePreview i.mgc_pic_2_line").addClass("hidden");
            };
            reader.readAsDataURL(file);
            fileChanged = true;
            checkChanges();
        } else {
            fileChanged = false;
            checkChanges();
        }
    });

    // Handle tombol edit: Ambil data dari server berdasarkan ID checked
    $(document).on("click", ".btn-edit", function () {
        // Tampilkan loader ketika edit diklik
        $("#loaderOverlay").removeClass("hidden");
        const $checked = $('input[type="checkbox"]:checked').not(
            '[id^="headerCheck"]'
        );
        if ($checked.length !== 1) {
            showWarning("Pilih satu data untuk diedit.");
            $("#loaderOverlay").addClass("hidden");
            return;
            // Tampilkan loader ketika edit diklik
        }

        const id = $checked.val();
        if (!id || !resourceName) {
            showError("ID atau resource name tidak ditemukan.");
            return;
        }

        // Fetch data dari server menggunakan route edit
        // Pengecekan prefix: Jika ada prefix, gunakan array [...prefixes, id]; jika tidak, gunakan id saja
        const routeParams = prefixes.length > 0 ? [...prefixes, id] : id;
        const editUrl = route(`${resourceName}.edit`, routeParams);
        $.ajax({
            url: editUrl,
            method: "GET",
            success: function (data) {
                // Populate form dengan data dari server
                populateForm(form, data, resourceName, prefixes, id);
                // Reset flag perubahan
                initialData = form.serialize();
                fileChanged = false;
                submitBtn.prop("disabled", true);
                // Tampilkan modal (gunakan class hidden untuk fc-modal)
                modal.removeClass("hidden");

                // Sembunyikan loader ketika data telah ditampilkan
                $("#loaderOverlay").addClass("hidden");
            },
            error: function (xhr) {
                showError("Gagal mengambil data untuk edit.");
                if (onError) onError(xhr);
                // Sembunyikan loader jika terjadi error
                $("#loaderOverlay").addClass("hidden");
            },
        });
    });

    // Reset form saat modal dibuka (jika belum diisi)
    modal.on("show.bs.modal", function () {
        if (!form.serialize()) {
            form.find('p[id^="error-"]').text("");
        }
    });

    // Pencegahan close modal saat klik di luar (overlay)
    modal.on("click", function (e) {
        if (e.target === this) {
            e.preventDefault();
            e.stopPropagation();
            // Tidak melakukan apa-apa, sehingga modal tidak tertutup
        }
    });

    // Handle submit
    form.on("submit", function (e) {
        e.preventDefault();

        // Callback sebelum submit
        if (beforeSubmit && !beforeSubmit()) {
            return;
        }

        const url = form.attr("action");
        const method = form.attr("method") || "POST";
        const formData = new FormData(this);

        // ✅ Pastikan input radio ikut ke FormData
        form.find('input[type="radio"]:checked').each(function () {
            formData.set($(this).attr("name"), $(this).val());
        });

        // Tampilkan konfirmasi
        confirmAction(confirmMessage, "Apakah Anda yakin?").then(
            (confirmed) => {
                if (!confirmed) return;

                // Bersihkan error
                form.find('p[id^="error-"]').text("");

                // Tampilkan loading
                if (loader.length) loader.removeClass("hidden");
                if (submitText.length) submitText.addClass("opacity-50");
                submitBtn.prop("disabled", true);

                $.ajax({
                    url,
                    method,
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        showSuccess(response.message || successMessage).then(
                            () => {
                                modal.addClass("hidden"); // Hide modal
                                if (onSuccess) {
                                    onSuccess(response);
                                } else if (response.redirect) {
                                    window.location.href = response.redirect;
                                }
                            }
                        );
                    },
                    error: function (xhr) {
                        handleFormError(xhr, form);
                        if (onError) onError(xhr);
                    },
                    complete: function () {
                        if (loader.length) loader.addClass("hidden");
                        if (submitText.length)
                            submitText.removeClass("opacity-50");
                        submitBtn.prop("disabled", false);
                    },
                });
            }
        );
    });

    // Disable tombol update saat load pertama
    submitBtn.prop("disabled", true);
}

/**
 * Populate form dengan data dari server
 * @param {jQuery} form - Form jQuery object
 * @param {Object} data - Data dari server
 * @param {string} resourceName - Nama resource
 * @param {string|number} id - ID item
 */
function populateForm(form, data, resourceName, prefixes, id) {
    // Set form action ke route update
    // Pengecekan prefix: Jika ada prefix, gunakan array [...prefixes, id]; jika tidak, gunakan id saja
    const routeParams = prefixes.length > 0 ? [...prefixes, id] : id;
    const updateUrl = route(`${resourceName}.update`, routeParams);
    form.attr("action", updateUrl);

    form.find("input, select, textarea").each(function () {
        const input = $(this);
        const key = input.attr("name");

        if (!key) return; // skip jika tidak ada name

        // Jika ada datanya dari server
        if (data.hasOwnProperty(key)) {
            const value = data[key];

            // --- HANDLE RADIO BUTTON ---
            if (input.attr("type") === "radio") {
                // Uncheck semua radio dengan nama yang sama
                form.find(`input[name="${key}"]`).prop("checked", false);

                // Konversi value ke string yang sesuai untuk radio button
                let valueStr;
                if (typeof value === "boolean") {
                    valueStr = value ? "1" : "0"; // true -> "1", false -> "0"
                } else {
                    valueStr = String(value); // Untuk number/string lainnya, konversi ke string
                }

                // Check radio yang cocok dengan value yang sudah dikonversi
                form.find(`input[name="${key}"][value="${valueStr}"]`).prop(
                    "checked",
                    true
                );

                // --- HANDLE CHECKBOX ---
            } else if (input.attr("type") === "checkbox") {
                if (Array.isArray(data[key])) {
                    input.prop("checked", data[key].includes(input.val()));
                } else {
                    input.prop("checked", value == input.val());
                }

                // --- HANDLE SELECT OPTION ---
            } else if (input.is("select")) {
                input.val(value).trigger("change");

                // Jika kamu pakai .nice-select plugin
                const $niceSelect = input.next(".nice-select");
                if ($niceSelect.length) {
                    $niceSelect.find(".option").removeClass("selected focus");
                    const $targetOption = $niceSelect.find(
                        `[data-value="${value}"]`
                    );
                    if ($targetOption.length) {
                        $targetOption.addClass("selected focus");
                        $niceSelect.find(".current").text($targetOption.text());
                    }
                }

                // --- HANDLE INPUT/ TEXTAREA BIASA ---
            } else {
                input.val(value);
            }
        }
    });

    // --- HANDLE PREVIEW GAMBAR (jika ada) ---
    if (data.gambar || data.image) {
        const imgSrc = data.gambar || data.image;
        form.find("#previewImg").attr("src", imgSrc).removeClass("hidden");
        form.find("#imagePreview i.mgc_pic_2_line").addClass("hidden");
    }
}

/**
 * Inisialisasi form delete untuk multiple data
 * @param {Object} config - Konfigurasi delete
 * @param {string} config.tableSelector - Selector untuk tabel (untuk checkbox)
 * @param {string} config.buttonSelector - Selector untuk tombol delete
 * @param {string|Function} config.deleteUrl - URL delete atau function yang return URL
 * @param {Function} config.onSuccess - Callback saat berhasil
 * @param {Function} config.onError - Callback saat error
 * @param {string} config.itemName - Nama item yang akan dihapus (untuk pesan)
 * @param {string} config.successMessage - Pesan sukses
 *
 * @example
 * initDeleteForm({
 *   tableSelector: '#table-produk',
 *   buttonSelector: '.btn-delete',
 *   deleteUrl: '/produk/delete-multiple',
 *   itemName: 'produk',
 *   onSuccess: () => {
 *     location.reload();
 *   }
 * });
 */
export function initDeleteForm(config = {}) {
    const {
        tableSelector,
        buttonSelector,
        deleteUrl,
        onSuccess = () => location.reload(),
        onError = (err) => console.error(err),
        itemName = "data",
        successMessage = "Data berhasil dihapus.",
    } = config;

    const $table = $(tableSelector);
    const $deleteBtn = $(buttonSelector);

    if ($table.length === 0 || $deleteBtn.length === 0) return;

    // Hindari multiple event binding
    $deleteBtn.off("click").on("click", function () {
        const $checked = $table.find(
            'input[type="checkbox"]:not(#headerCheck):checked'
        );

        if ($checked.length === 0) {
            showWarning("Pilih minimal satu data untuk dihapus.");
            return;
        }

        const ids = $checked
            .map(function () {
                return $(this).val();
            })
            .get();

        const csrfToken = $('meta[name="csrf-token"]').attr("content");
        if (!csrfToken) {
            console.error("CSRF token tidak ditemukan.");
            return;
        }

        // Konfirmasi sebelum hapus menggunakan confirmDelete dari notification
        confirmDelete(itemName).then((confirmed) => {
            if (!confirmed) return;

            $.ajax({
                url:
                    typeof deleteUrl === "function"
                        ? deleteUrl(ids)
                        : deleteUrl,
                method: "DELETE",
                headers: {
                    "X-CSRF-TOKEN": csrfToken,
                },
                contentType: "application/json",
                data: JSON.stringify({
                    ids,
                }),
                success: function (response) {
                    showSuccess(response.message || successMessage).then(() => {
                        onSuccess(response);
                    });
                },
                error: function (xhr) {
                    const message =
                        xhr.responseJSON?.message || "Gagal menghapus data";
                    showError(message);
                    onError(xhr);
                },
            });
        });
    });
}

/**
 * Show modal helper — tambahkan class yang diperlukan agar Tailwind variant aktif
 * @param {string|jQuery} modalSelector
 */
function showModal(modalSelector) {
    const $modal = $(modalSelector);
    if (!$modal.length) return;
    // pastikan outer tampil (display) dan variant Tailwind aktif
    $modal.removeClass("hidden").addClass("fc-modal-open flex open");
    // inner element memakai kelas variant fc-modal-open:opacity-100, aktifkan opacity
    $modal
        .find(".fc-modal-open\\:opacity-100, .opacity-0")
        .first()
        .removeClass("opacity-0")
        .addClass("opacity-100");
}

/**
 * Hide modal helper
 * @param {string|jQuery} modalSelector
 */
function hideModal(modalSelector) {
    const $modal = $(modalSelector);
    if (!$modal.length) return;
    // kembalikan opacity lalu sembunyikan outer setelah animasi singkat
    const $inner = $modal
        .find(".fc-modal-open\\:opacity-100, .opacity-100")
        .first();
    $inner.removeClass("opacity-100").addClass("opacity-0");
    setTimeout(() => {
        $modal.removeClass("fc-modal-open flex open").addClass("hidden");
    }, 250);
}

/**
 * Handle form error (validation errors)
 * @param {Object} xhr - XMLHttpRequest object
 * @param {jQuery} form - Form jQuery object
 * @param {Object} options - { modalSelector: string (optional) }
 */
function handleFormError(xhr, form, options = {}) {
    const { modalSelector = null } = options || {};

    // Reset semua error messages di form (biarkan hanya di scope form)
    form.find('p[id^="error-"]').text("");

    if (xhr.status === 422 && xhr.responseJSON?.errors) {
        // Handle validasi Laravel standar (422)
        const errors = xhr.responseJSON.errors;
        let firstFieldEl = null;

        Object.keys(errors).forEach((key) => {
            // sanitize key -> cocokkan id attribute
            // contoh: "data.name" atau "items[0].name" -> ubah menjadi data_name atau items_0_name
            const sanitized = String(key)
                .replace(/\$/g, "")
                .replace(/\$/g, "_")
                .replace(/\./g, "_")
                .replace(/__+/g, "_")
                .replace(/^_+|_+$/g, "");

            const selectors = [
                `#error-${sanitized}`,
                `#error-${key}`,
                `#error-edit-${sanitized}`,
                `#error-edit-${key}`,
            ].join(", ");

            const errorElement = form.find(selectors).first();

            if (errorElement.length) {
                errorElement.text(errors[key][0]);
                if (!firstFieldEl) {
                    // coba fokus ke input yang sesuai (nama asli atau sanitized)
                    firstFieldEl = form
                        .find(`[name="${key}"], [name="${sanitized}"]`)
                        .first();
                }
            } else {
                // fallback: cari by name and append inline error if element exists
                const $field = form
                    .find(`[name="${key}"], [name="${sanitized}"]`)
                    .first();
                if ($field.length) {
                    // cari sibling p.error di sekitar field
                    const $near = $field
                        .closest(".form-group")
                        .find('p[id^="error-"]')
                        .first();
                    if ($near.length) {
                        $near.text(errors[key][0]);
                        if (!firstFieldEl) firstFieldEl = $field;
                    }
                }
            }
        });

        // Jika modal disediakan, pastikan modal tampil sehingga pesan terlihat
        if (modalSelector) {
            showModal(modalSelector);
        } else {
            // jika form ada dalam modal (cari parent .fc-modal)
            const $parentModal = form.closest(".fc-modal");
            if ($parentModal.length) showModal($parentModal);
        }

        // scroll dan fokus ke field pertama yang error
        if (firstFieldEl && firstFieldEl.length) {
            try {
                const $modalBody = form
                    .closest(".fc-modal")
                    .find(".modal-body, .fc-modal-body")
                    .first();
                if ($modalBody.length) {
                    const top = firstFieldEl.position()?.top || 0;
                    $modalBody.animate({ scrollTop: top - 20 }, 200);
                } else {
                    $("html, body").animate(
                        { scrollTop: firstFieldEl.offset().top - 100 },
                        200
                    );
                }
                firstFieldEl.focus();
            } catch (e) {
                // ignore
            }
        }

        // tampilkan satu notifikasi ringkas
        showError("Terdapat kesalahan pada form. Silakan periksa kembali.");
    } else if (xhr.status === 500 && xhr.responseJSON?.error) {
        // Handle error database (500) - khusus untuk unique constraint violation
        const errorMessage = xhr.responseJSON.error;
        let firstFieldEl = null;

        // Deteksi unique violation (PostgreSQL/MySQL style)
        const uniqueRegex =
            /duplicate key value violates unique constraint "([^"]+)"/i;
        const match = errorMessage.match(uniqueRegex);

        if (match) {
            const constraintName = match[1]; // e.g., "produks_sku_unique"

            // Ekstrak field dari constraint name (asumsi format: table_field_unique)
            // Misalnya: "produks_sku_unique" -> "sku"
            const fieldMatch = constraintName.match(/^[^_]+_([^_]+)_unique$/);
            if (fieldMatch) {
                const field = fieldMatch[1]; // e.g., "sku"

                // Sanitize field untuk selector (mirip dengan 422)
                const sanitized = String(field)
                    .replace(/\$/g, "")
                    .replace(/\$/g, "_")
                    .replace(/\./g, "_")
                    .replace(/__+/g, "_")
                    .replace(/^_+|_+$/g, "");

                const selectors = [
                    `#error-${sanitized}`,
                    `#error-${field}`,
                    `#error-edit-${sanitized}`,
                    `#error-edit-${field}`,
                ].join(", ");

                const errorElement = form.find(selectors).first();

                if (errorElement.length) {
                    errorElement.text(
                        `${field.toUpperCase()} sudah ada, gunakan nilai yang berbeda.`
                    );
                    // Fokus ke field yang bermasalah
                    firstFieldEl = form
                        .find(`[name="${field}"], [name="${sanitized}"]`)
                        .first();
                } else {
                    // Fallback: cari by name dan append inline error
                    const $field = form
                        .find(`[name="${field}"], [name="${sanitized}"]`)
                        .first();
                    if ($field.length) {
                        const $near = $field
                            .closest(".form-group")
                            .find('p[id^="error-"]')
                            .first();
                        if ($near.length) {
                            $near.text(
                                `${field.toUpperCase()} sudah ada, gunakan nilai yang berbeda.`
                            );
                            firstFieldEl = $field;
                        }
                    }
                }
            }
        }

        // Jika modal disediakan, pastikan modal tampil
        if (modalSelector) {
            showModal(modalSelector);
        } else {
            const $parentModal = form.closest(".fc-modal");
            if ($parentModal.length) showModal($parentModal);
        }

        // Scroll dan fokus ke field pertama yang error
        if (firstFieldEl && firstFieldEl.length) {
            try {
                const $modalBody = form
                    .closest(".fc-modal")
                    .find(".modal-body, .fc-modal-body")
                    .first();
                if ($modalBody.length) {
                    const top = firstFieldEl.position()?.top || 0;
                    $modalBody.animate({ scrollTop: top - 20 }, 200);
                } else {
                    $("html, body").animate(
                        { scrollTop: firstFieldEl.offset().top - 100 },
                        200
                    );
                }
                firstFieldEl.focus();
            } catch (e) {
                // ignore
            }
        }

        // Tampilkan notifikasi error
        if (match) {
            showError("Terdapat data yang sudah ada. Silakan periksa kembali.");
        } else {
            // Fallback untuk error 500 lainnya
            const message =
                xhr.responseJSON?.message ||
                "Terjadi kesalahan server. Silakan coba lagi.";
            showError(message);
        }
    } else {
        // Handle error lainnya (misalnya, 500 tanpa format spesifik atau status lain)
        const message =
            xhr.responseJSON?.message ||
            "Terjadi kesalahan. Silakan coba lagi.";
        showError(message);
    }
}

/**
 * Snapshot FormData untuk perbandingan
 * @param {FormData} formData - FormData object
 * @returns {string} JSON string dari FormData
 */
function snapshotFormData(formData) {
    const entries = [];
    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            entries.push([key, value.name || ""]);
        } else {
            entries.push([key, value]);
        }
    }
    return JSON.stringify(entries);
}

/**
 * Setup validasi input number (hanya angka, min 1)
 * @param {string} selector - Selector untuk input number
 *
 * @example
 * setupNumberInput('input[type="number"]');
 */
export function setupNumberInput(selector = 'input[type="number"]') {
    $(document).ready(function () {
        // Cegah input selain angka
        $(selector).on("keypress", function (e) {
            const charCode = e.which ? e.which : e.keyCode;
            if (charCode < 48 || charCode > 57) {
                e.preventDefault();
            }
        });

        // Cegah nilai di bawah 1
        $(selector).on("input", function () {
            const val = $(this).val();
            const min = $(this).attr("min") || 1;
            if (val < min || isNaN(val)) {
                $(this).val("");
            }
        });

        // Cegah scroll mouse
        $(selector).on("wheel", function (e) {
            $(this).blur();
        });
    });
}

/**
 * Setup preview image untuk file input
 * @param {string} inputSelector - Selector untuk file input
 * @param {string} previewSelector - Selector untuk preview image
 *
 * @example
 * setupImagePreview('#fileInput', '#previewImg');
 */
export function setupImagePreview(inputSelector, previewSelector) {
    $(inputSelector).on("change", function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $(previewSelector)
                    .attr("src", e.target.result)
                    .removeClass("hidden");
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Reset form ke kondisi awal
 * @param {string} formSelector - Selector untuk form
 *
 * @example
 * resetForm('#form-create-produk');
 */
export function resetForm(formSelector) {
    const form = $(formSelector);
    if (!form.length) return;

    form[0].reset();
    form.find('p[id^="error-"]').text("");
    form.find('img[id*="preview"]').addClass("hidden");
    form.find('button[type="submit"]').prop("disabled", true);
}
