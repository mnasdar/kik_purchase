/**
 * Modul PO Onsite - Bulk Edit
 * Mengelola form bulk edit onsite untuk multiple purchase order items
 */
import $ from "jquery";
import flatpickr from "flatpickr";
import { route } from "ziggy-js";
import { showToast } from "../../../core/notification";

$(document).ready(function() {
    if (!$("#form-bulk-edit-onsite").length) return;

    initBulkEdit();
});

export function initBulkEdit() {
    setupFlatpickr();
    updateSLAValues();
    setupFormSubmit();
}

/**
 * Setup Flatpickr for date picker
 */
function setupFlatpickr() {
    if (document.getElementById('onsite_date')) {
        flatpickr('#onsite_date', {
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'd-M-y',
            defaultDate: $('#onsite_date').val() || null,
            allowInput: true,
            onChange: updateSLAValues,
        });

        // Ensure manual typing also triggers recalculation
        $('#onsite_date').on('change', updateSLAValues);
    }
}

/**
 * Calculate working days (Mon-Fri) between two dates (inclusive)
 */
function calculateWorkingDays(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return null;

    const start = new Date(`${startDateStr}T00:00:00`);
    const end = new Date(`${endDateStr}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    if (end < start) return null;

    let count = 0;
    const current = new Date(start);
    while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}

/**
 * Recalculate SLA Realisasi for all rows when onsite date changes
 */
function updateSLAValues() {
    const onsiteDate = $('#onsite_date').val();
    $('.sla-display').each(function() {
        const approvedDate = $(this).data('approved-date');
        const id = $(this).data('id');
        const initial = $(this).data('initial');

        let value = initial === '' || initial === null || initial === undefined ? '' : initial;

        if (onsiteDate && approvedDate) {
            const days = calculateWorkingDays(approvedDate, onsiteDate);
            if (days !== null) {
                value = days;
            }
        }

        const displayText = value === '' ? '-' : `${value} hari`;
        $(this).text(displayText);
        $(`input[name="sla_realisasi[${id}]"]`).val(value);
    });
}

/**
 * Setup form submit handler
 */
function setupFormSubmit() {
    // Get IDs from data attribute
    const idsData = $('#form-bulk-edit-onsite').data('ids');
    const ids = Array.isArray(idsData) ? idsData : [];

    $('#form-bulk-edit-onsite').on('submit', function(e) {
        e.preventDefault();

        // Collect SLA values per onsite id
        const slaRealisasi = {};
        $("input[name^='sla_realisasi[']").each(function() {
            const name = $(this).attr('name');
            const match = name.match(/sla_realisasi\[(\d+)\]/);
            if (match) {
                const id = match[1];
                const val = $(this).val();
                slaRealisasi[id] = val !== '' ? parseInt(val, 10) : null;
            }
        });

        const payload = {
            ids: ids,
            onsite_date: $('#onsite_date').val(),
            sla_realisasi: slaRealisasi,
        };

        if (!payload.onsite_date) {
            showToast('Tanggal Onsite harus diisi', 'warning', 2000);
            return;
        }

        const btn = $('#btn-submit');
        const originalText = btn.html();
        btn.prop('disabled', true).html('<i class="mgc_spinner_2_line animate-spin mr-2"></i>Menyimpan...');

        $.ajax({
            url: route('po-onsite.bulk-update'),
            method: 'POST',
            data: JSON.stringify(payload),
            contentType: 'application/json',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                showToast(response.message, 'success', 2000);
                setTimeout(() => {
                    window.location.href = response.redirect;
                }, 500);
            },
            error: function(xhr) {
                const response = xhr.responseJSON || {};
                showToast(response.message || 'Gagal menyimpan perubahan', 'error', 2000);
                btn.prop('disabled', false).html(originalText);
            }
        });
    });
}

export default initBulkEdit;
