/**
 * Modul Classification - Update
 * Mengelola update klasifikasi
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showError, showToast } from "../../../core/notification.js";

let currentClassificationId = null;

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
    }, 300);
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
 * Edit classification
 */
export function initEditButton() {
    $(document).on("click", ".btn-edit-classification", async function () {
        const classificationId = $(this).data("id");
        currentClassificationId = classificationId;
        
        try {
            const response = await $.get(route("klasifikasi.show", classificationId));
            
            $("#classification_id").val(response.id);
            $("#name").val(response.name);
            $("#form_method").val("PUT");
            
            $("#classificationModalTitle").text("Edit Klasifikasi");
            $("#classificationModalIcon").removeClass("mgc_classify_2_line").addClass("mgc_edit_line");
            $("#submitButtonText").text("Update");
            showModal();
        } catch (error) {
            console.error("Error fetching classification:", error);
            showError('Gagal mengambil data klasifikasi', 'Gagal!');
        }
    });
}

/**
 * Submit form (Update)
 */
export function initUpdateSubmit() {
    $("#classificationFormSubmit").on("click", async function () {
        const btn = $(this);
        const originalText = $("#submitButtonText").text();
        const method = $("#form_method").val();
        
        // Only handle update here
        if (method !== "PUT") return;
        
        // Disable button
        btn.prop("disabled", true);
        $("#submitButtonText").html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');
        
        const formData = {
            name: $("#name").val(),
        };
        
        try {
            const response = await $.ajax({
                url: route("klasifikasi.update", currentClassificationId),
                method: "PUT",
                data: formData,
                dataType: "json",
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                },
            });
            
            hideModal();
            showToast('Klasifikasi berhasil diperbarui!', 'success', 2000);
            setTimeout(() => location.reload(), 500);
        } catch (error) {
            if (error.status === 422) {
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
