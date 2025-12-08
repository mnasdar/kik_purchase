/**
 * Modul Supplier Management
 * Mengelola CRUD supplier dengan modal
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showSuccess, showError, showToast } from "../../../core/notification.js";

let actionTippyInstances = [];
let currentSupplierId = null;
let deleteMode = "single"; // 'single' or 'bulk'

/**
 * Inisialisasi tabel supplier
 */
function initSuppliersTable() {
    if (!$("#table-suppliers").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "supplier_type",
            name: "Type",
            width: "100px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "name",
            name: "Nama Supplier",
            width: "200px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "contact_person",
            name: "Contact Person",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "phone",
            name: "Telepon",
            width: "140px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "email",
            name: "Email",
            width: "200px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "created_by",
            name: "Created By",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "npwp",
            name: "NPWP",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "actions",
            name: "Actions",
            width: "80px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];

    const buttonConfig = [
        { selector: "#btn-delete-selected", when: "multiple" },
    ];

    initGridTable({
        tableId: "#table-suppliers",
        dataUrl: route("supplier.data"),
        columns: columns,
        enableCheckbox: true,
        buttonConfig: buttonConfig,
        limit: 10,
        enableFilter: false,
        onDataLoaded: (data) => {
            $("#data-count").text(data.length);
            initActionTooltips();
        },
    });
}

/**
 * Init tooltips for action buttons
 */
function initActionTooltips() {
    actionTippyInstances.forEach((inst) => inst.destroy());
    actionTippyInstances = [];

    const targets = document.querySelectorAll('#table-suppliers [data-plugin="tippy"]');
    if (targets.length) {
        actionTippyInstances = tippy(targets);
    }
}

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
        resetForm();
    }, 300);
}

/**
 * Reset form
 */
function resetForm() {
    $("#supplierForm")[0].reset();
    $("#supplier_id").val("");
    $("#form_method").val("POST");
    currentSupplierId = null;
    
    // Clear all error messages
    $("[id^='error-']").addClass("hidden").text("");
    
    // Remove error styling from inputs
    $("#supplierForm input, #supplierForm select, #supplierForm textarea").removeClass("border-red-500");
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
 * Open create modal
 */
$("#btn-create-supplier").on("click", function () {
    resetForm();
    $("#supplierModalTitle").text("Tambah Supplier");
    $("#supplierModalIcon").removeClass("mgc_edit_line").addClass("mgc_contacts_line");
    $("#submitButtonText").text("Simpan");
    showToast('Form siap untuk diisi', 'info', 1500);
    showModal();
});

/**
 * Edit supplier
 */
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

/**
 * Submit form (Create/Update)
 */
$("#supplierFormSubmit").on("click", async function () {
    const btn = $(this);
    const originalText = $("#submitButtonText").text();
    
    // Disable button
    btn.prop("disabled", true);
    $("#submitButtonText").html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');
    
    try {
        const formData = new FormData($("#supplierForm")[0]);
        const method = $("#form_method").val();
        const url = method === "PUT" 
            ? route("supplier.update", { supplier: currentSupplierId })
            : route("supplier.store");
        
        const response = await fetch(url, {
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
            const message = method === "PUT" ? 'Supplier berhasil diperbarui!' : 'Supplier berhasil ditambahkan!';
            showToast(message, 'success', 2000);
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

/**
 * Delete single supplier
 */
$(document).on("click", ".btn-delete-supplier", function () {
    currentSupplierId = $(this).data("id");
    const supplierName = $(this).data("name");
    deleteMode = "single";
    
    $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus supplier "${supplierName}"?`);
    showDeleteModal();
});

/**
 * Delete selected suppliers (bulk)
 */
$("#btn-delete-selected").on("click", function () {
    const checkboxes = $("#table-suppliers input[type='checkbox']:checked:not(.select-all)");
    const count = checkboxes.length;
    
    if (count === 0) {
        showToast('Pilih supplier yang ingin dihapus', 'warning', 2000);
        return;
    }
    
    deleteMode = "bulk";
    $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus ${count} supplier yang dipilih?`);
    showDeleteModal();
});

/**
 * Confirm delete
 */
$("#deleteModalConfirm").on("click", async function () {
    const btn = $(this);
    btn.prop("disabled", true).html('<i class="mgc_loading_line animate-spin mr-2"></i>Menghapus...');
    
    try {
        let url, body;
        
        if (deleteMode === "single") {
            url = route("supplier.destroy", { supplier: currentSupplierId });
            body = new FormData();
            body.append("_method", "DELETE");
        } else {
            // Bulk delete
            const checkboxes = $("#table-suppliers input[type='checkbox']:checked:not(.select-all)");
            const ids = checkboxes.map(function() {
                return $(this).val();
            }).get();
            
            url = route("supplier.bulkDestroy");
            body = new FormData();
            body.append("_method", "DELETE");
            ids.forEach(id => body.append("ids[]", id));
        }
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                "Accept": "application/json",
            },
            body: body,
        });
        
        const data = await response.json();
        
        if (response.ok) {
            hideDeleteModal();
            const ids = deleteMode === "single" 
                ? [currentSupplierId]
                : $("#table-suppliers input[type='checkbox']:checked:not(.select-all)").map(function() { return $(this).val(); }).get();
            const message = deleteMode === "single" 
                ? 'Supplier berhasil dihapus!' 
                : `${ids.length} supplier berhasil dihapus!`;
            showToast(message, 'success', 2000);
            setTimeout(() => location.reload(), 500);
        } else {
            showError(data.message || 'Gagal menghapus supplier', 'Gagal!');
        }
    } catch (error) {
        showError('Gagal menghapus supplier', 'Gagal!');
        console.error(error);
    } finally {
        btn.prop("disabled", false).text("Hapus");
    }
});

/**
 * Show delete modal
 */
function showDeleteModal() {
    const modal = $("#deleteModal");
    const backdrop = $("#deleteModalBackdrop");
    const content = $("#deleteModalContent");

    modal.removeClass("hidden").css("opacity", "1");
    
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ "transform": "scale(1)", "opacity": "1" });
    });
}

/**
 * Hide delete modal
 */
function hideDeleteModal() {
    const backdrop = $("#deleteModalBackdrop");
    const content = $("#deleteModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        $("#deleteModal").addClass("hidden").css("opacity", "0");
    }, 300);
}

/**
 * Close modals
 */
$("#supplierModalClose, #supplierModalCancel").on("click", hideModal);
$("#deleteModalCancel").on("click", hideDeleteModal);

// Close on backdrop click
$("#supplierModal").on("click", function (e) {
    if (e.target === this) hideModal();
});

$("#deleteModal").on("click", function (e) {
    if (e.target === this) hideDeleteModal();
});

// Close on ESC key
$(document).on("keydown", function (e) {
    if (e.key === "Escape") {
        if (!$("#supplierModal").hasClass("hidden")) hideModal();
        if (!$("#deleteModal").hasClass("hidden")) hideDeleteModal();
    }
});

/**
 * Refresh button
 */
$("#btn-refresh").on("click", function () {
    const btn = $(this);
    const icon = btn.find("i");
    
    btn.prop("disabled", true);
    icon.addClass("animate-spin");
    showToast('Memuat data...', 'info', 1000);
    
    setTimeout(() => {
        location.reload();
    }, 500);
});

/**
 * Initialize on document ready
 */
$(document).ready(function () {
    initSuppliersTable();
});
