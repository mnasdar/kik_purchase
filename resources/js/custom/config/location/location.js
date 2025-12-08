/**
 * Modul Location (Unit Kerja) Management
 * Mengelola CRUD unit kerja dengan modal
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showSuccess, showError, showToast } from "../../../core/notification.js";

let actionTippyInstances = [];
let currentLocationId = null;
let deleteMode = "single"; // 'single' or 'bulk'

/**
 * Inisialisasi tabel unit kerja
 */
function initLocationsTable() {
    if (!$("#table-locations").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "name",
            name: "Nama Unit Kerja",
            width: "300px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "users_count",
            name: "Users",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "purchase_requests_count",
            name: "Purchase Requests",
            width: "180px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "created_at",
            name: "Dibuat",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "actions",
            name: "Actions",
            width: "120px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];

    const buttonConfig = [
        { selector: "#btn-delete-selected", when: "multiple" },
    ];

    initGridTable({
        tableId: "#table-locations",
        dataUrl: route("unit-kerja.data"),
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

    const targets = document.querySelectorAll('#table-locations [data-plugin="tippy"]');
    if (targets.length) {
        actionTippyInstances = tippy(targets);
    }
}

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
    currentLocationId = null;
    
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
 * Open create modal
 */
$("#btn-create-location").on("click", function () {
    resetForm();
    $("#locationModalTitle").text("Tambah Unit Kerja");
    $("#locationModalIcon").removeClass("mgc_edit_line").addClass("mgc_location_line");
    $("#submitButtonText").text("Simpan");
    showToast('Form siap untuk diisi', 'info', 1500);
    showModal();
});

/**
 * Edit location
 */
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

/**
 * Submit form (Create/Update)
 */
$("#locationFormSubmit").on("click", async function () {
    const btn = $(this);
    const originalText = $("#submitButtonText").text();
    
    // Disable button
    btn.prop("disabled", true);
    $("#submitButtonText").html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');
    
    try {
        const formData = new FormData($("#locationForm")[0]);
        const method = $("#form_method").val();
        const url = method === "PUT" 
            ? route("unit-kerja.update", { unit_kerja: currentLocationId })
            : route("unit-kerja.store");
        
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
            const message = method === "PUT" ? 'Unit kerja berhasil diperbarui!' : 'Unit kerja berhasil ditambahkan!';
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
        showError('Gagal menyimpan data unit kerja', 'Gagal!');
        console.error(error);
    } finally {
        btn.prop("disabled", false);
        $("#submitButtonText").text(originalText);
    }
});

/**
 * Delete single location
 */
$(document).on("click", ".btn-delete-location", function () {
    currentLocationId = $(this).data("id");
    const locationName = $(this).data("name");
    deleteMode = "single";
    
    $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus unit kerja "${locationName}"?`);
    showDeleteModal();
});

/**
 * Delete selected locations (bulk)
 */
$("#btn-delete-selected").on("click", function () {
    const checkboxes = $("#table-locations input[type='checkbox']:checked:not(.select-all)");
    const count = checkboxes.length;
    
    if (count === 0) {
        showToast('Pilih unit kerja yang ingin dihapus', 'warning', 2000);
        return;
    }
    
    deleteMode = "bulk";
    $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus ${count} unit kerja yang dipilih?`);
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
            url = route("unit-kerja.destroy", { unit_kerja: currentLocationId });
            body = new FormData();
            body.append("_method", "DELETE");
        } else {
            // Bulk delete
            const checkboxes = $("#table-locations input[type='checkbox']:checked:not(.select-all)");
            const ids = checkboxes.map(function() {
                return $(this).val();
            }).get();
            
            url = route("unit-kerja.bulkDestroy");
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
                ? [currentLocationId]
                : $("#table-locations input[type='checkbox']:checked:not(.select-all)").map(function() { return $(this).val(); }).get();
            const message = deleteMode === "single" 
                ? 'Unit kerja berhasil dihapus!' 
                : `${ids.length} unit kerja berhasil dihapus!`;
            showToast(message, 'success', 2000);
            setTimeout(() => location.reload(), 500);
        } else {
            showError(data.message || 'Gagal menghapus unit kerja', 'Gagal!');
        }
    } catch (error) {
        showError('Gagal menghapus unit kerja', 'Gagal!');
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
$("#locationModalClose, #locationModalCancel").on("click", hideModal);
$("#deleteModalCancel").on("click", hideDeleteModal);

// Close on backdrop click
$("#locationModal").on("click", function (e) {
    if (e.target === this) hideModal();
});

$("#deleteModal").on("click", function (e) {
    if (e.target === this) hideDeleteModal();
});

// Close on ESC key
$(document).on("keydown", function (e) {
    if (e.key === "Escape") {
        if (!$("#locationModal").hasClass("hidden")) hideModal();
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
    initLocationsTable();
});
