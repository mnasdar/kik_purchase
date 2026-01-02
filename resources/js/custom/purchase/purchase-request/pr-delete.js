/**
 * Modul Purchase Request - Delete
 * Mengelola penghapusan purchase request
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showToast, showError } from "../../../core/notification.js";

let deleteTargetIds = [];
let prefix = null;

/**
 * Show modal dengan animasi
 */
function showModal() {
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
 * Hide modal dengan animasi
 */
function hideModal() {
    const backdrop = $("#deleteModalBackdrop");
    const content = $("#deleteModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        $("#deleteModal").addClass("hidden").css("opacity", "0");
        deleteTargetIds = [];
    }, 300);
}

/**
 * Initialize delete button
 */
export function initPRDelete() {
    prefix = $('[data-prefix]').data('prefix');

    // Single delete button
    $(document).on("click", ".btn-delete-pr", function () {
        const id = $(this).data("id");
        const number = $(this).data("number");
        
        deleteTargetIds = [id];
        $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus PR "${number}"?`);
        showModal();
    });

    // Bulk delete button
    $("#btn-delete-selected").on("click", function () {
        const checked = $(".form-checkbox:checked").not("#headerCheck");
        
        if (checked.length === 0) {
            showToast('Pilih minimal 1 PR untuk dihapus', 'warning', 2000);
            return;
        }

        deleteTargetIds = checked.map(function () {
            return $(this).val();
        }).get();

        $("#deleteMessage").text(`Apakah Anda yakin ingin menghapus ${deleteTargetIds.length} purchase request?`);
        showModal();
    });

    // Confirm delete
    $("#deleteModalConfirm").on("click", async function () {
        const btn = $(this);
        const originalText = btn.text();
        
        btn.prop("disabled", true).text("Menghapus...");

        try {
            await $.ajax({
                url: route("purchase-request.bulkDestroy", { prefix }),
                method: "DELETE",
                data: { ids: deleteTargetIds },
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                },
            });

            hideModal();
            showToast('Purchase request berhasil dihapus!', 'success', 2000);
            setTimeout(() => location.reload(), 500);
        } catch (error) {
            showError(error.responseJSON?.message || 'Gagal menghapus purchase request', 'Gagal!');
        } finally {
            btn.prop("disabled", false).text(originalText);
        }
    });

    // Cancel delete
    $("#deleteModalCancel").on("click", hideModal);

    // Close on backdrop click
    $("#deleteModal").on("click", function (e) {
        if ($(e.target).is("#deleteModal")) hideModal();
    });

    // Close on ESC key
    $(document).on("keydown", function (e) {
        if (e.key === "Escape") {
            if (!$("#deleteModal").hasClass("hidden")) hideModal();
        }
    });
}
