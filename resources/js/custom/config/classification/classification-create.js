/**
 * Modul Classification - Create
 * Mengelola pembuatan klasifikasi baru
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showError, showToast, confirmAction } from "../../../core/notification.js";

/**
 * Show modal dengan animasi
 */
function showModal() {
    const modal = $("#classificationModal");
    const backdrop = $("#classificationModalBackdrop");
    const content = $("#classificationModalContent");

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
    const backdrop = $("#classificationModalBackdrop");
    const content = $("#classificationModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        $("#classificationModal").addClass("hidden").css("opacity", "0");
        resetForm();
    }, 300);
}

/**
 * Reset form
 */
function resetForm() {
    $("#classificationForm")[0].reset();
    $("#classification_id").val("");
    $("#form_method").val("POST");
    
    // Clear all error messages
    $("[id^='error-']").addClass("hidden").text("");
    
    // Remove error styling from inputs
    $("#classificationForm input, #classificationForm select, #classificationForm textarea").removeClass("border-red-500");
}

/**
 * Show error messages
 */
function showErrors(errors) {
    // Clear previous errors
    $("[id^='error-']").addClass("hidden").text("");
    $("#classificationForm input, #classificationForm select, #classificationForm textarea").removeClass("border-red-500");

    // Show new errors
    for (const [field, messages] of Object.entries(errors)) {
        const errorElement = $(`#error-${field}`);
        const inputElement = $(`#${field}`);
        
        if (errorElement.length && inputElement.length) {
            errorElement.removeClass("hidden").text(messages[0]);
            inputElement.addClass("border-red-500");
        }
    }
    
    // Highlight first error field
    const firstErrorField = $("#classificationForm .border-red-500").first();
    if (firstErrorField.length) {
        firstErrorField.focus();
    }
}

/**
 * Enable submit via Enter key
 */
export function initFormSubmit() {
    $("#classificationForm").on("submit", function (e) {
        e.preventDefault();
        $("#classificationFormSubmit").trigger("click");
    });
}

/**
 * Open create modal
 */
export function initCreateButton() {
    $("#btn-create-classification").on("click", function () {
        resetForm();
        $("#classificationModalTitle").text("Tambah Klasifikasi");
        $("#classificationModalIcon").removeClass("mgc_edit_line").addClass("mgc_classify_2_line");
        $("#submitButtonText").text("Simpan");
        showToast('Form siap untuk diisi', 'info', 1500);
        showModal();
    });
}

/**
 * Submit form (Create)
 */
export function initCreateSubmit() {
    $("#classificationFormSubmit").on("click", async function () {
        const btn = $(this);
        const originalText = $("#submitButtonText").text();
        const method = $("#form_method").val();
        
        // Only handle create here
        if (method === "PUT") return;
        
        // Disable button
        btn.prop("disabled", true);
        $("#submitButtonText").html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');
        
        const formData = {
            name: $("#name").val(),
        };
        
        try {
            const response = await $.ajax({
                url: route("klasifikasi.store"),
                method: "POST",
                data: formData,
                dataType: "json",
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                },
            });
            
            hideModal();
            showToast('Klasifikasi berhasil ditambahkan!', 'success', 2000);
            setTimeout(() => location.reload(), 500);
        } catch (error) {
            // Handle soft-deleted duplicate (case-insensitive)
            if (error.status === 409 && error.responseJSON?.status === 'soft-deleted') {
                const name = $("#name").val();
                const confirmed = await confirmAction(
                    `Data "${name}" sudah pernah ditambahkan dan dinonaktifkan. Aktifkan kembali?`,
                    'Aktifkan data?'
                );

                if (!confirmed) {
                    showToast('Data tidak diaktifkan. Anda tetap di form ini.', 'info', 2000);
                    return;
                }

                try {
                    await $.ajax({
                        url: route("klasifikasi.store"),
                        method: "POST",
                        data: {
                            ...formData,
                            reactivate: true,
                            reactivate_id: error.responseJSON.id,
                        },
                        dataType: "json",
                        headers: {
                            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                        },
                    });

                    hideModal();
                    showToast('Klasifikasi diaktifkan kembali dan diperbarui!', 'success', 2000);
                    setTimeout(() => location.reload(), 500);
                } catch (nestedError) {
                    if (nestedError.status === 422) {
                        showErrors(nestedError.responseJSON.errors);
                        showToast('Mohon periksa kembali data yang Anda masukkan', 'error', 3000);
                    } else {
                        showError(nestedError.responseJSON?.message || 'Terjadi kesalahan saat menyimpan data', 'Gagal!');
                    }
                }
            } else if (error.status === 422) {
                showErrors(error.responseJSON.errors);
                showToast('Mohon periksa kembali data yang Anda masukkan', 'error', 3000);
            } else {
                showError(error.responseJSON?.message || 'Terjadi kesalahan saat menyimpan data', 'Gagal!');
            }
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
    $("#classificationModalClose, #classificationModalCancel").on("click", hideModal);
    
    // Close on backdrop click
    $("#classificationModal").on("click", function (e) {
        if ($(e.target).is("#classificationModal")) hideModal();
    });
    
    // Close on ESC key
    $(document).on("keydown", function (e) {
        if (e.key === "Escape") {
            if (!$("#classificationModal").hasClass("hidden")) hideModal();
        }
    });
}
