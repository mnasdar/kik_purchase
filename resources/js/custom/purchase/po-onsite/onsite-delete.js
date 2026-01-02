/**
 * Modul PO Onsite - Delete
 * Mengelola hapus single / bulk onsite
 */
import $ from "jquery";
import { route } from "ziggy-js";
import { showToast, showError } from "../../../core/notification";

let deleteTargetIds = [];

function showModal(message) {
    const modal = $("#deleteModal");
    const backdrop = $("#deleteModalBackdrop");
    const content = $("#deleteModalContent");

    $("#deleteMessage").text(message || "Apakah Anda yakin ingin menghapus data ini?");
    modal.removeClass("hidden").css("opacity", "1");
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ transform: "scale(1)", opacity: "1" });
    });
}

function hideModal() {
    const backdrop = $("#deleteModalBackdrop");
    const content = $("#deleteModalContent");
    backdrop.css("opacity", "0");
    content.css({ transform: "scale(0.95)", opacity: "0" });
    setTimeout(() => {
        $("#deleteModal").addClass("hidden").css("opacity", "0");
        deleteTargetIds = [];
    }, 300);
}

export function initOnsiteDelete() {
    // Single delete
    $(document).off("click", ".btn-delete-onsite").on("click", ".btn-delete-onsite", function () {
        const id = $(this).data("id");
        const poNumber = $(this).data("po-number");
        deleteTargetIds = [id];
        showModal(`Apakah Anda yakin ingin menghapus onsite untuk PO "${poNumber}"?`);
    });

    // Bulk delete
    $(document).off("click", "#btn-delete-selected").on("click", "#btn-delete-selected", function () {
        const checked = $(".form-checkbox:checked").not("#headerCheck");
        if (!checked.length) {
            showToast("Pilih minimal 1 data untuk dihapus", "warning", 2000);
            return;
        }
        deleteTargetIds = checked.map(function () { return $(this).val(); }).get();
        showModal(`Apakah Anda yakin ingin menghapus ${deleteTargetIds.length} data onsite?`);
    });

    // Confirm
    $(document).off("click", "#deleteModalConfirm").on("click", "#deleteModalConfirm", async function () {
        const btn = $(this);
        const original = btn.text();
        btn.prop("disabled", true).text("Menghapus...");
        try {
            await $.ajax({
                url: route("po-onsite.bulkDestroy"),
                method: "DELETE",
                data: { ids: deleteTargetIds },
                headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
            });
            hideModal();
            showToast("Data onsite berhasil dihapus!", "success", 2000);
            setTimeout(() => window.location.reload(), 500);
        } catch (error) {
            showError(error?.responseJSON?.message || "Gagal menghapus data onsite", "Gagal!");
        } finally {
            btn.prop("disabled", false).text(original);
        }
    });

    // Cancel and backdrop
    $(document).off("click", "#deleteModalCancel").on("click", "#deleteModalCancel", hideModal);
    $(document).off("click", "#deleteModal").on("click", "#deleteModal", function (e) {
        if ($(e.target).is("#deleteModal")) hideModal();
    });
    $(document).off("keydown.onsite-delete").on("keydown.onsite-delete", function (e) {
        if (e.key === "Escape" && !$("#deleteModal").hasClass("hidden")) hideModal();
    });
}

export default initOnsiteDelete;
