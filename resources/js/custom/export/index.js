/**
 * Export Module
 * Handle export data to Excel
 */
import $ from "jquery";
import { route } from "ziggy-js";
import flatpickr from "flatpickr";
import { showToast, showError } from "../../core/notification";

let dateRangePicker = null;

/**
 * Format date to YYYY-MM-DD using local timezone
 */
function formatDateToYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Initialize date range picker
 */
function initDateRangePicker() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    dateRangePicker = flatpickr("#date_range", {
        mode: "range",
        dateFormat: "d M Y",
        defaultDate: [firstDayOfMonth, today],
        maxDate: today,
        locale: {
            firstDayOfWeek: 1,
            rangeSeparator: " s/d ",
            weekdays: {
                shorthand: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
                longhand: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
            },
            months: {
                shorthand: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                longhand: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
            }
        },
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                $('#start_date').val(formatDateToYMD(selectedDates[0]));
                $('#end_date').val(formatDateToYMD(selectedDates[1]));
            } else if (selectedDates.length === 1) {
                $('#start_date').val(formatDateToYMD(selectedDates[0]));
                $('#end_date').val('');
            }
        },
        onClose: function(selectedDates) {
            // Ensure both dates are set when picker closes
            if (selectedDates.length === 2) {
                $('#start_date').val(formatDateToYMD(selectedDates[0]));
                $('#end_date').val(formatDateToYMD(selectedDates[1]));
            }
        }
    });

    // Set initial values
    const selectedDates = dateRangePicker.selectedDates;
    if (selectedDates.length === 2) {
        $('#start_date').val(formatDateToYMD(selectedDates[0]));
        $('#end_date').val(formatDateToYMD(selectedDates[1]));
    }
}

/**
 * Handle quick date filter buttons
 */
function initQuickFilters() {
    $('.btn-quick-filter').on('click', function() {
        const period = $(this).data('period');
        const dates = getDateRangeByPeriod(period);
        
        if (dates) {
            dateRangePicker.setDate([dates.start, dates.end]);
            showToast(`Filter diatur ke: ${$(this).text().trim()}`, 'success', 1500);
        }
    });
}

/**
 * Get date range by period
 */
function getDateRangeByPeriod(period) {
    const today = new Date();
    const dates = { start: null, end: today };

    switch(period) {
        case 'today':
            dates.start = today;
            break;
        case 'yesterday':
            dates.start = new Date(today.getTime() - (1 * 24 * 60 * 60 * 1000));
            dates.end = dates.start;
            break;
        case 'this-week':
            const firstDayOfWeek = new Date(today);
            firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1);
            dates.start = firstDayOfWeek;
            break;
        case 'last-week':
            const lastWeekEnd = new Date(today);
            lastWeekEnd.setDate(today.getDate() - today.getDay());
            const lastWeekStart = new Date(lastWeekEnd);
            lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
            dates.start = lastWeekStart;
            dates.end = lastWeekEnd;
            break;
        case 'this-month':
            dates.start = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'last-month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            dates.start = lastMonth;
            dates.end = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'last-30-days':
            dates.start = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            break;
        case 'this-year':
            dates.start = new Date(today.getFullYear(), 0, 1);
            break;
        default:
            return null;
    }

    return dates;
}

/**
 * Show loading overlay
 */
function showLoadingOverlay() {
    $('#export-loading-overlay').removeClass('hidden');
    // Prevent scrolling
    $('body').css('overflow', 'hidden');
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
    $('#export-loading-overlay').addClass('hidden');
    // Allow scrolling
    $('body').css('overflow', 'auto');
}

/**
 * Handle form submission
 */
function initFormSubmit() {
    $('#form-export').on('submit', function(e) {
        e.preventDefault();

        const startDate = $('#start_date').val();
        const endDate = $('#end_date').val();
        const filterType = $('#filter_type').val();
        const locationId = $('#export_location').val();

        if (!startDate || !endDate) {
            showError('Mohon pilih rentang tanggal', 'Validasi Error');
            return;
        }

        if (!filterType) {
            showError('Mohon pilih tipe filter (PR atau PO)', 'Validasi Error');
            return;
        }

        // Show loading overlay
        showLoadingOverlay();

        // Show loading on button
        const $btnExport = $('#btn-export');
        const originalText = $btnExport.html();
        $btnExport.prop('disabled', true).html('<i class="mgc_loading_line animate-spin"></i> Mengexport...');

        // Build export URL with location parameter
        let exportUrl = route('export.data') + '?start_date=' + startDate + '&end_date=' + endDate + '&filter_type=' + filterType;
        if (locationId) {
            exportUrl += '&location_id=' + locationId;
        }
        
        // Create temporary anchor element for download
        const link = document.createElement('a');
        link.href = exportUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Hide loading and show success message
        setTimeout(() => {
            hideLoadingOverlay();
            showToast('Export berhasil! File akan segera diunduh.', 'success', 3000);
            $btnExport.prop('disabled', false).html(originalText);
            document.body.removeChild(link);
        }, 2000);
    });
}

/**
 * Reset form
 */
function initReset() {
    $('#btn-reset').on('click', function() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        dateRangePicker.setDate([firstDayOfMonth, today]);
        
        // Reset filter type to default (PR)
        $('#filter_type').val('pr');
        
        // Reset location to default (empty for Super Admin, or user's location for staff)
        const locationSelect = $('#export_location');
        if (!locationSelect.is(':disabled')) {
            // Super Admin - reset to "Semua Lokasi" (empty value)
            locationSelect.val('');
        }
        // For disabled select (staff), don't change the value
        
        showToast('Form direset ke default (bulan ini)', 'info', 1500);
    });
}

/**
 * Clear date range
 */
function initClearButton() {
    $('#clear-date-range').on('click', function() {
        dateRangePicker.clear();
        $('#start_date').val('');
        $('#end_date').val('');
        showToast('Pilihan tanggal dihapus', 'info', 1500);
    });
}

/**
 * Initialize module
 */
$(document).ready(function() {
    initDateRangePicker();
    initQuickFilters();
    initFormSubmit();
    initReset();
    initClearButton();
});
