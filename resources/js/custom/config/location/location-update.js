/**
 * Modul Location - Update
 * Mengelola update unit kerja
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showError, showToast } from "../../../core/notification.js";

let currentLocationId = null;

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
    }, 300);
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
 * Edit location
 */
export function initEditButton() {
    $(document).on("click", ".btn-edit-location", async function () {
        const locationId = $(this).data("id");
        currentLocationId = locationId;
        
        try {
            const response = await fetch(route("unit-kerja.show", { unit_kerja: locationId }));
            const data = await response.json();
            
            // Fill form
            $("#location_id").val(data.id);
            $("#form_method").val("PUT");
            $("#name").val(data.name);
            
            $("#locationModalTitle").text("Edit Unit Kerja");
            $("#locationModalIcon").removeClass("mgc_location_line").addClass("mgc_edit_line");
            $("#submitButtonText").text("Update");
            showModal();
        } catch (error) {
            showError('Gagal mengambil data unit kerja', 'Gagal!');
            console.error(error);
        }
    });
}

/**
 * Submit form (Update)
 */
export function initUpdateSubmit() {
    $("#locationFormSubmit").on("click", async function () {
        const btn = $(this);
        const originalText = $("#submitButtonText").text();
        const method = $("#form_method").val();
        
        // Only handle update here
        if (method !== "PUT") return;
        
        // Disable button
        btn.prop("disabled", true);
        $("#submitButtonText").html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');
        
        try {
            const formData = new FormData($("#locationForm")[0]);
            
            const response = await fetch(route("unit-kerja.update", { unit_kerja: currentLocationId }), {
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
                showToast('Unit kerja berhasil diperbarui!', 'success', 2000);
                setTimeout(() => location.reload(), 500);
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
