/**
 * Modul Classification Management
 * Mengelola CRUD klasifikasi dengan modal
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showSuccess, showError, showToast } from "../../../core/notification.js";

let actionTippyInstances = [];
let currentClassificationId = null;
let deleteMode = "single"; // 'single' or 'bulk'

/**
 * Inisialisasi tabel klasifikasi
 */
function initClassificationsTable() {
    if (!$("#table-classifications").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "type",
            name: "Tipe",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "name",
            name: "Nama Klasifikasi",
            width: "250px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "purchase_request_items_count",
            name: "PR Items",
            width: "130px",
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
        tableId: "#table-classifications",
        dataUrl: route("klasifikasi.data"),
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

    const targets = document.querySelectorAll('#table-classifications [data-plugin="tippy"]');
    if (targets.length) {
        actionTippyInstances = tippy(targets, { arrow: true });
    }
}

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
    currentClassificationId = null;
    
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
 * Open create modal
 */
$("#btn-create-classification").on("click", function () {
    resetForm();
    $("#classificationModalTitle").text("Tambah Klasifikasi");
    $("#classificationModalIcon").removeClass("mgc_edit_line").addClass("mgc_classify_2_line");
    $("#submitButtonText").text("Simpan");
    showToast('Form siap untuk diisi', 'info', 1500);
    showModal();
});

/**
 * Edit classification
 */
$(document).on("click", ".btn-edit-classification", async function () {
    const classificationId = $(this).data("id");
    currentClassificationId = classificationId;
    
    try {
        const response = await $.get(route("klasifikasi.show", classificationId));
        
        $("#classification_id").val(response.id);
        $("#type").val(response.type);
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

/**
 * Submit form (Create/Update)
 */
$("#classificationFormSubmit").on("click", async function () {
    const btn = $(this);
    const originalText = $("#submitButtonText").text();
    
    // Disable button
    btn.prop("disabled", true);
    $("#submitButtonText").html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');
    
    const formData = {
        type: $("#type").val(),
        name: $("#name").val(),
    };
    
    const method = $("#form_method").val();
    const isUpdate = method === "PUT";
    
    try {
        let url, ajaxMethod;
        
        if (isUpdate) {
            url = route("klasifikasi.update", currentClassificationId);
            ajaxMethod = "PUT";
        } else {
            url = route("klasifikasi.store");
            ajaxMethod = "POST";
        }
        
        const response = await $.ajax({
            url: url,
            method: ajaxMethod,
            data: formData,
            dataType: "json",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
        });
        
        hideModal();
        const message = isUpdate ? 'Klasifikasi berhasil diperbarui!' : 'Klasifikasi berhasil ditambahkan!';
        showToast(message, 'success', 2000);
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

/**
 * Delete single classification
 */
$(document).on("click", ".btn-delete-classification", function () {
    deleteMode = "single";
    currentClassificationId = $(this).data("id");
    const name = $(this).data("name");
    $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus klasifikasi "${name}"?`);
    showDeleteModal();
});

/**
 * Delete selected classifications (bulk)
 */
$("#btn-delete-selected").on("click", function () {
    const selectedIds = [];
    $("#table-classifications input[type='checkbox']:checked").each(function () {
        selectedIds.push($(this).val());
    });
    
    if (selectedIds.length === 0) return;
    
    deleteMode = "bulk";
    currentClassificationId = selectedIds;
    $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus ${selectedIds.length} klasifikasi?`);
    showDeleteModal();
});

/**
 * Confirm delete
 */
$("#deleteModalConfirm").on("click", async function () {
    const btn = $(this);
    btn.prop("disabled", true).text("Menghapus...");
    
    try {
        if (deleteMode === "single") {
            await $.ajax({
                url: route("klasifikasi.destroy", currentClassificationId),
                method: "DELETE",
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                },
            });
        } else {
            await $.ajax({
                url: route("klasifikasi.bulkDestroy"),
                method: "DELETE",
                data: { ids: currentClassificationId },
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                },
            });
        }
        
        hideDeleteModal();
        const message = deleteMode === "single" 
            ? 'Klasifikasi berhasil dihapus!' 
            : `${currentClassificationId.length} klasifikasi berhasil dihapus!`;
        showToast(message, 'success', 2000);
        setTimeout(() => location.reload(), 500);
    } catch (error) {
        showError(error.responseJSON?.message || 'Gagal menghapus data', 'Gagal!');
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
$("#classificationModalClose, #classificationModalCancel").on("click", hideModal);
$("#deleteModalCancel").on("click", hideDeleteModal);

// Close on backdrop click
$("#classificationModal").on("click", function (e) {
    if ($(e.target).is("#classificationModal")) hideModal();
});

$("#deleteModal").on("click", function (e) {
    if ($(e.target).is("#deleteModal")) hideDeleteModal();
});

// Close on ESC key
$(document).on("keydown", function (e) {
    if (e.key === "Escape") {
        if (!$("#classificationModal").hasClass("hidden")) hideModal();
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
    initClassificationsTable();
});
