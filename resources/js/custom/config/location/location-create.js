/**
 * Modul Location - Create
 * Mengelola pembuatan unit kerja baru
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showError, showToast, confirmAction } from "../../../core/notification.js";

/**
 * Show modal dengan animasi
 */
function showModal() {
    const modal = $("#locationModal");
    const backdrop = $("#locationModalBackdrop");
    const content = $("#locationModalContent");

    modal.removeClass("hidden").css("opacity", "1");
    
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ "transform": "scale(1)", "opacity": "1" });
    });
}

/**
 * Hide modal dengan animasi
 */
function hideModal() {
    const backdrop = $("#locationModalBackdrop");
    const content = $("#locationModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        $("#locationModal").addClass("hidden").css("opacity", "0");
        resetForm();
    }, 300);
}

/**
 * Reset form
 */
function resetForm() {
    $("#locationForm")[0].reset();
    $("#location_id").val("");
    $("#form_method").val("POST");
    
    // Clear all error messages
    $("[id^='error-']").addClass("hidden").text("");
    
    // Remove error styling from inputs
    $("#locationForm input, #locationForm select, #locationForm textarea").removeClass("border-red-500");
}

/**
 * Show error messages
 */
function showErrors(errors) {
    // Clear previous errors
    $('[id^="error-"]').addClass("hidden").text("");
    $("#locationForm input, #locationForm select, #locationForm textarea").removeClass("border-red-500");

    // Show new errors
    for (const [field, messages] of Object.entries(errors)) {
        const errorEl = $(`#error-${field}`);
        const inputEl = $(`[name="${field}"]`);
        
        if (errorEl.length) {
            errorEl.removeClass("hidden").text(messages[0]);
            inputEl.addClass("border-red-500");
        }
    }
    
    // Highlight first error field
    const firstErrorField = $("#locationForm .border-red-500").first();
    if (firstErrorField.length) {
        firstErrorField.focus();
    }
}

/**
 * Enable submit via Enter key
 */
export function initFormSubmit() {
    $("#locationForm").on("submit", function (e) {
        e.preventDefault();
        $("#locationFormSubmit").trigger("click");
    });
}

/**
 * Open create modal
 */
export function initCreateButton() {
    $("#btn-create-location").on("click", function () {
        resetForm();
        $("#locationModalTitle").text("Tambah Unit Kerja");
        $("#locationModalIcon").removeClass("mgc_edit_line").addClass("mgc_location_line");
        $("#submitButtonText").text("Simpan");
        showToast('Form siap untuk diisi', 'info', 1500);
        showModal();
    });
}

/**
 * Submit form (Create)
 */
export function initCreateSubmit() {
    $("#locationFormSubmit").on("click", async function () {
        const btn = $(this);
        const originalText = $("#submitButtonText").text();
        const method = $("#form_method").val();
        
        // Only handle create here
        if (method === "PUT") return;
        
        // Disable button
        btn.prop("disabled", true);
        $("#submitButtonText").html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');
        
        try {
            const formData = new FormData($("#locationForm")[0]);
            
            const response = await fetch(route("unit-kerja.store"), {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                    "Accept": "application/json",
                },
                body: formData,
            });
            
            const data = await response.json();

            if (response.ok) {
                hideModal();
                showToast('Unit kerja berhasil ditambahkan!', 'success', 2000);
                setTimeout(() => location.reload(), 500);
            } else if (response.status === 409 && data.status === 'soft-deleted') {
                const name = $("#name").val();
                const confirmed = await confirmAction(
                    `Data "${name}" sudah pernah ditambahkan dan dinonaktifkan. Aktifkan kembali?`,
                    'Aktifkan data?'
                );

                if (!confirmed) {
                    showToast('Data tidak diaktifkan. Anda tetap di form ini.', 'info', 2000);
                    return;
                }

                const reactivateForm = new FormData($("#locationForm")[0]);
                reactivateForm.append('reactivate', '1');
                reactivateForm.append('reactivate_id', data.id);

                const reactivateResponse = await fetch(route("unit-kerja.store"), {
                    method: "POST",
                    headers: {
                        "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                        "Accept": "application/json",
                    },
                    body: reactivateForm,
                });

                const reactivateData = await reactivateResponse.json();

                if (reactivateResponse.ok) {
                    hideModal();
                    showToast('Unit kerja diaktifkan kembali dan diperbarui!', 'success', 2000);
                    setTimeout(() => location.reload(), 500);
                } else if (reactivateData.errors) {
                    showErrors(reactivateData.errors);
                    showToast('Mohon periksa kembali data yang Anda masukkan', 'error', 3000);
                } else {
                    showError(reactivateData.message || 'Terjadi kesalahan saat menyimpan data', 'Gagal!');
                }
            } else {
                if (data.errors) {
                    showErrors(data.errors);
                    showToast('Mohon periksa kembali data yang Anda masukkan', 'error', 3000);
                } else {
                    showError(data.message || 'Terjadi kesalahan saat menyimpan data', 'Gagal!');
                }
            }
        } catch (error) {
            showError('Gagal menyimpan data unit kerja', 'Gagal!');
            console.error(error);
        } finally {
            btn.prop("disabled", false);
            $("#submitButtonText").text(originalText);
        }
    });
}

/**
 * Close modals
 */
export function initModalClose() {
    $("#locationModalClose, #locationModalCancel").on("click", hideModal);
    
    // Close on backdrop click
    $("#locationModal").on("click", function (e) {
        if (e.target === this) hideModal();
    });
    
    // Close on ESC key
    $(document).on("keydown", function (e) {
        if (e.key === "Escape") {
            if (!$("#locationModal").hasClass("hidden")) hideModal();
        }
    });
}
