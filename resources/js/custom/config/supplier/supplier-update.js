/**
 * Modul Supplier - Update
 * Mengelola update supplier
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showError, showToast } from "../../../core/notification.js";

let currentSupplierId = null;

/**
 * Show modal dengan animasi
 */
function showModal() {
    const modal = $("#supplierModal");
    const backdrop = $("#supplierModalBackdrop");
    const content = $("#supplierModalContent");

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
    const backdrop = $("#supplierModalBackdrop");
    const content = $("#supplierModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        $("#supplierModal").addClass("hidden").css("opacity", "0");
    }, 300);
}

/**
 * Show error messages
 */
function showErrors(errors) {
    // Clear previous errors
    $('[id^="error-"]').addClass("hidden").text("");
    $("#supplierForm input, #supplierForm select, #supplierForm textarea").removeClass("border-red-500");

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
    const firstErrorField = $("#supplierForm .border-red-500").first();
    if (firstErrorField.length) {
        firstErrorField.focus();
    }
}

/**
 * Edit supplier
 */
export function initEditButton() {
    $(document).on("click", ".btn-edit-supplier", async function () {
        const supplierId = $(this).data("id");
        currentSupplierId = supplierId;
        
        try {
            const response = await fetch(route("supplier.show", { supplier: supplierId }));
            const data = await response.json();
            
            // Fill form
            $("#supplier_id").val(data.id);
            $("#form_method").val("PUT");
            $(`input[name="supplier_type"][value="${data.supplier_type}"]`).prop("checked", true);
            $("#name").val(data.name);
            $("#contact_person").val(data.contact_person);
            $("#phone").val(data.phone);
            $("#email").val(data.email);
            $("#address").val(data.address);
            $("#tax_id").val(data.tax_id);
            
            $("#supplierModalTitle").text("Edit Supplier");
            $("#supplierModalIcon").removeClass("mgc_contacts_line").addClass("mgc_edit_line");
            $("#submitButtonText").text("Update");
            showModal();
        } catch (error) {
            showError('Gagal mengambil data supplier', 'Gagal!');
            console.error(error);
        }
    });
}

/**
 * Submit form (Update)
 */
export function initUpdateSubmit() {
    $("#supplierFormSubmit").on("click", async function () {
        const btn = $(this);
        const originalText = $("#submitButtonText").text();
        const method = $("#form_method").val();
        
        // Only handle update here
        if (method !== "PUT") return;
        
        // Disable button
        btn.prop("disabled", true);
        $("#submitButtonText").html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');
        
        try {
            const formData = new FormData($("#supplierForm")[0]);
            
            const response = await fetch(route("supplier.update", { supplier: currentSupplierId }), {
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
                showToast('Supplier berhasil diperbarui!', 'success', 2000);
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
            showError('Gagal menyimpan data supplier', 'Gagal!');
            console.error(error);
        } finally {
            btn.prop("disabled", false);
            $("#submitButtonText").text(originalText);
        }
    });
}
