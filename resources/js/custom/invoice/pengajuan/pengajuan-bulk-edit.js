/**
 * Modul Pengajuan Invoice - Bulk Edit
 * Menangani bulk edit pengajuan invoice
 */
import $ from "jquery";
import flatpickr from "flatpickr";
import Id from "flatpickr/dist/l10n/id";
import { route } from "ziggy-js";
import { showToast, showError } from "../../../core/notification";

flatpickr.localize(Id);

$(document).ready(function () {
    initBulkEdit();
});

export function initBulkEdit() {
    initDatePickers();
    setupFormSubmit();
}

/**
 * Initialize date pickers for all date fields
 */
function initDatePickers() {
    const dateInputs = document.querySelectorAll(".date-picker-field");
    dateInputs.forEach((input) => {
        flatpickr(input, {
            dateFormat: "Y-m-d",
            locale: "id",
            altInput: true,
            altFormat: "d-M-Y",
            allowInput: true,
        });
    });
}

/**
 * Setup form submission handler
 */
function setupFormSubmit() {
    const $form = $("#bulk-edit-form");

    $form.on("submit", function (e) {
        e.preventDefault();

        // Get IDs
        const ids = $('input[name="ids"]').val().split(",").filter((id) => id);
        
        // Get single form values
        const submittedDate = $('#bulk_invoice_submitted_at').val();

        // Build invoice data - apply same values to all IDs
        const invoiceData = {};
        ids.forEach((id) => {
            invoiceData[id] = {
                invoice_submitted_at: submittedDate || null,
            };
        });

        // Prepare data for submission
        const data = {
            ids: ids,
            invoice_data: invoiceData,
        };

        console.log("Updating invoices:", data);
        submitUpdate(data, $form);
    });
}

/**
 * Submit update to server
 */
function submitUpdate(data, $form) {
    const $submitBtn = $form.find('button[type="submit"]');
    const originalText = $submitBtn.html();

    $submitBtn.prop("disabled", true).html(
        '<i class="mgc_loader_2_line animate-spin"></i> Mengupdate...'
    );

    $.ajax({
        url: route("pengajuan.bulk-update"),
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        headers: {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
        },
        success: function (response) {
            console.log("Success response:", response);
            showToast(response.message || "Invoice berhasil diupdate!", "success", 2000);

            // Redirect
            setTimeout(() => {
                window.location.href = response.redirect || route("pengajuan.history");
            }, 1500);
        },
        error: function (xhr) {
            console.error("Error response:", xhr);
            let message = "Gagal mengupdate invoice";

            if (xhr.responseJSON) {
                if (xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                } else if (xhr.responseJSON.errors) {
                    const errors = Object.values(xhr.responseJSON.errors).flat();
                    message = errors.join(", ");
                }
            }

            showError(message, "Error!");
        },
        complete: function () {
            $submitBtn.prop("disabled", false).html(originalText);
        },
    });
}

export default initBulkEdit;
