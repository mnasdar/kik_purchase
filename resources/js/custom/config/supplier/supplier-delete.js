/**
 * Modul Supplier - Delete
 * Mengelola penghapusan supplier
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showError, showToast } from "../../../core/notification.js";

let currentSupplierId = null;
let deleteMode = "single"; // 'single' or 'bulk'

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
 * Delete single supplier
 */
export function initDeleteButton() {
    $(document).on("click", ".btn-delete-supplier", function () {
        currentSupplierId = $(this).data("id");
        const supplierName = $(this).data("name");
        deleteMode = "single";
        
        $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus supplier "${supplierName}"?`);
        showDeleteModal();
    });
}

/**
 * Delete selected suppliers (bulk)
 */
export function initBulkDeleteButton() {
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
}

/**
 * Confirm delete
 */
export function initDeleteConfirm() {
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
}

/**
 * Close delete modal
 */
export function initDeleteModalClose() {
    $("#deleteModalCancel").on("click", hideDeleteModal);
    
    // Close on backdrop click
    $("#deleteModal").on("click", function (e) {
        if (e.target === this) hideDeleteModal();
    });
    
    // Close on ESC key
    $(document).on("keydown", function (e) {
        if (e.key === "Escape") {
            if (!$("#deleteModal").hasClass("hidden")) hideDeleteModal();
        }
    });
}
