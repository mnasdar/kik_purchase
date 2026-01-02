/**
 * Modul PO Onsite - Update
 * Mengelola form update onsite untuk item purchase order
 */
import $ from "jquery";
import flatpickr from "flatpickr";
import { route } from "ziggy-js";
import { showToast, showError } from "../../../core/notification";

const onsiteId = $('[data-onsite-id]').data('onsite-id');

/**
 * Calculate working days (Monday-Friday) between two dates
 */
function calculateWorkingDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    let current = new Date(start);

    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}

$(document).ready(function() {
    if (!$("#form-edit-onsite").length) return;

    initOnsiteUpdate();
});

export function initOnsiteUpdate() {
    setupFlatpickr();
    setupFormSubmit();
    
    // Calculate initial SLA realization
    calculateSLARealization();
}

/**
 * Setup Flatpickr for date picker
 */
function setupFlatpickr() {
    const onsiteDateInput = document.getElementById("onsite_date");
    const initialDate = $(onsiteDateInput).attr('data-date');

    flatpickr("#onsite_date", {
        dateFormat: "d-M-y",
        altInput: true,
        altFormat: "d-M-y",
        defaultDate: initialDate,
        onChange: function(selectedDates, dateStr, instance) {
            calculateSLARealization();
        }
    });
}

/**
 * Calculate SLA Realization
 */
function calculateSLARealization() {
    const approvedDate = $("#po-approved-date").attr('data-date');
    const onsiteDateInput = $("#onsite_date").val();

    if (!approvedDate || !onsiteDateInput) {
        return;
    }

    // Convert onsite date from "d-M-y" format to "Y-m-d"
    const onsiteDateParts = onsiteDateInput.split('-');
    if (onsiteDateParts.length !== 3) return;

    const months = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };

    const day = onsiteDateParts[0].padStart(2, '0');
    const month = months[onsiteDateParts[1]] || '01';
    const year = '20' + onsiteDateParts[2];
    const onsiteDate = `${year}-${month}-${day}`;

    // Calculate working days
    const workingDays = calculateWorkingDays(approvedDate, onsiteDate);
    $("#sla_realization").val(workingDays);
}

/**
 * Setup form submit
 */
function setupFormSubmit() {
    $("#form-edit-onsite").on("submit", async function(e) {
        e.preventDefault();

        const formData = {
            onsite_date: convertDateFormat($("#onsite_date").val()),
            sla_po_to_onsite_realization: $("#sla_realization").val() || null,
        };

        const btn = $("#btn-submit");
        const originalText = btn.html();
        btn.prop("disabled", true).html('<i class="mgc_loading_line animate-spin"></i> Mengupdate...');

        clearAllFieldErrors();

        try {
            await $.ajax({
                url: route("po-onsite.update", { po_onsite: onsiteId }),
                method: "PUT",
                data: formData,
                headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
            });

            showToast("Data onsite berhasil diupdate!", "success", 2000);
            setTimeout(() => {
                window.location.href = route("po-onsite.index");
            }, 500);
        } catch (error) {
            if (error.status === 422 && error.responseJSON?.errors) {
                displayFieldErrors(error.responseJSON.errors);
            }
            showError(error?.responseJSON?.message || "Gagal mengupdate data onsite", "Gagal!");
            btn.prop("disabled", false).html(originalText);
        }
    });
}

/**
 * Convert date format from "d-M-y" to "Y-m-d"
 */
function convertDateFormat(dateStr) {
    if (!dateStr) return null;

    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const months = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };

    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]] || '01';
    const year = '20' + parts[2];

    return `${year}-${month}-${day}`;
}

/**
 * Display field-level validation errors
 */
function displayFieldErrors(errors) {
    const fieldAlias = {
        'sla_po_to_onsite_realization': 'sla_realization'
    };
    Object.keys(errors).forEach(field => {
        const targetField = fieldAlias[field] || field;
        const errorDiv = $(`#error-${targetField}`);
        if (errorDiv.length) {
            errorDiv.text(errors[field][0]).removeClass("hidden");
            $(`#${targetField}`).addClass("border-danger");
        }
    });
}

/**
 * Clear all field errors
 */
function clearAllFieldErrors() {
    $("[id^='error-']").addClass("hidden").text("");
    $(".form-input, .form-select").removeClass("border-danger");
}

export default initOnsiteUpdate;
