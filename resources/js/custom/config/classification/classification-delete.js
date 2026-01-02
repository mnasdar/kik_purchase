/**
 * Modul Classification - Delete
 * Mengelola penghapusan klasifikasi
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showError, showToast } from "../../../core/notification.js";

let currentClassificationId = null;
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
 * Delete single classification
 */
export function initDeleteButton() {
    $(document).on("click", ".btn-delete-classification", function () {
        deleteMode = "single";
        currentClassificationId = $(this).data("id");
        const name = $(this).data("name");
        $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus klasifikasi "${name}"?`);
        showDeleteModal();
    });
}

/**
 * Delete selected classifications (bulk)
 */
export function initBulkDeleteButton() {
    $("#btn-delete-selected").on("click", function () {
        const selectedIds = [];
        $("#table-classifications input[type='checkbox']:checked").each(function () {
            selectedIds.push($(this).val());
        });
        
        if (selectedIds.length === 0) {
            showToast('Pilih klasifikasi yang ingin dihapus', 'warning', 2000);
            return;
        }
        
        deleteMode = "bulk";
        currentClassificationId = selectedIds;
        $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus ${selectedIds.length} klasifikasi?`);
        showDeleteModal();
    });
}

/**
 * Confirm delete
 */
export function initDeleteConfirm() {
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
}

/**
 * Close delete modal
 */
export function initDeleteModalClose() {
    $("#deleteModalCancel").on("click", hideDeleteModal);
    
    // Close on backdrop click
    $("#deleteModal").on("click", function (e) {
        if ($(e.target).is("#deleteModal")) hideDeleteModal();
    });
    
    // Close on ESC key
    $(document).on("keydown", function (e) {
        if (e.key === "Escape") {
            if (!$("#deleteModal").hasClass("hidden")) hideDeleteModal();
        }
    });
}
