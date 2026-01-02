/**
 * Modul Invoice - Delete
 */
import $ from "jquery";
import { route } from "ziggy-js";
import { showToast, showError } from "../../../core/notification";

export function initInvoiceDelete() {
    $(document).off("click", "#btn-delete-selected").on("click", "#btn-delete-selected", function () {
        const selectedIds = $(".form-checkbox:checked")
            .not("#headerCheck")
            .map(function () {
                return $(this).val();
            })
            .get();

        if (selectedIds.length === 0) {
            showToast("Pilih minimal 1 item untuk dihapus", "warning", 2000);
            return;
        }

        openDeleteModal(selectedIds);
    });
}

function openDeleteModal(ids) {
    const modal = $("#deleteModal");
    const backdrop = $("#deleteModalBackdrop");
    const content = $("#deleteModalContent");
    const message = $("#deleteMessage");

    message.text(`Apakah Anda yakin ingin menghapus ${ids.length} data invoice?`);

    modal.removeClass("hidden");
    modal.css("opacity", "1");
    setTimeout(() => {
        backdrop.css("opacity", "1");
        content.css({ transform: "scale(1)", opacity: "1" });
    }, 10);

    $("#deleteModalConfirm")
        .off("click")
        .on("click", function () {
            deleteInvoices(ids);
            closeDeleteModal();
        });

    $("#deleteModalCancel, #deleteModalBackdrop")
        .off("click")
        .on("click", function () {
            closeDeleteModal();
        });
}

function closeDeleteModal() {
    const backdrop = $("#deleteModalBackdrop");
    const content = $("#deleteModalContent");
    const modal = $("#deleteModal");

    backdrop.css("opacity", "0");
    content.css({ transform: "scale(0.95)", opacity: "0" });
    setTimeout(() => {
        modal.addClass("hidden").css("opacity", "0");
    }, 300);
}

function deleteInvoices(ids) {
    $.ajax({
        url: route("dari-vendor.bulkDestroy"),
        method: "DELETE",
        data: { ids },
        headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
        success: function (response) {
            showToast(response.message, "success", 2000);
            setTimeout(() => location.reload(), 500);
        },
        error: function (xhr) {
            showError(xhr?.responseJSON?.message || "Gagal menghapus invoice", "Error!");
        },
    });
}

export default initInvoiceDelete;
