/**
 * Modul PO Onsite - Create
 * Mengelola form create onsite untuk item purchase order
 */
import $ from "jquery";
import flatpickr from "flatpickr";
import { route } from "ziggy-js";
import { showToast, showError, confirmAction } from "../../../core/notification";

// Store selected items
let selectedItems = [];

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
    if (!$("#form-create-onsite").length) return;

    initOnsiteCreate();
});

export function initOnsiteCreate() {
    setupFlatpickr();
    setupSearchPO();
    setupFormSubmit();
    setupMultipleSelection();
    setupClearSelection();
}

/**
 * Setup Flatpickr for date picker
 */
function setupFlatpickr() {
    flatpickr("#onsite_date", {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d-M-y",
        allowInput: true,
        onChange: function(selectedDates, dateStr, instance) {
            calculateSLARealization();
        }
    });
}

/**
 * Setup search PO functionality
 */
function setupSearchPO() {
    // Search button click
    $("#btn-search-po").on("click", function() {
        const keyword = $("#search-po").val().trim();
        if (!keyword) {
            showToast("Masukkan nomor PO untuk mencari", "warning", 2000);
            return;
        }
        searchPO(keyword);
    });

    // Enter key on search input
    $("#search-po").on("keypress", function(e) {
        if (e.which === 13) {
            e.preventDefault();
            $("#btn-search-po").click();
        }
    });
}

/**
 * Search PO by keyword
 */
async function searchPO(keyword) {
    try {
        showToast("Mencari PO...", "info", 1000);
        
        const response = await $.ajax({
            url: route("po-onsite.search", { keyword }),
            method: "GET",
        });

        if (response.length === 0) {
            showToast("PO tidak ditemukan", "warning", 2000);
            $("#search-results").addClass("hidden");
            return;
        }

        displaySearchResults(response);
        showToast("PO ditemukan!", "success", 1500);
    } catch (error) {
        showError(error?.responseJSON?.message || "Gagal mencari PO", "Error!");
    }
}

/**
 * Display search results in table
 */
function displaySearchResults(items) {
    const tbody = $("#search-results-body");
    tbody.empty();

    // Filter out items yang sudah dipilih
    const selectedItemIds = selectedItems.map(item => item.id);
    const filteredItems = items.filter(item => !selectedItemIds.includes(item.id));

    // Jika tidak ada hasil setelah filtering
    if (filteredItems.length === 0) {
        const message = selectedItems.length > 0 
            ? "Semua item dari PO ini sudah dipilih"
            : "Tidak ada data ditemukan";
        
        tbody.html(`
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <i class="mgc_information_line text-3xl mb-2"></i>
                    <p>${message}</p>
                </td>
            </tr>
        `);
        $("#search-results").removeClass("hidden");
        return;
    }

    filteredItems.forEach(item => {
        const statusBadge = item.has_onsite 
            ? `<span class="badge bg-success text-white text-xs">Ada (${item.onsites_count})</span>`
            : '<span class="badge bg-slate-400 text-white text-xs">Belum</span>';

        const row = `
            <tr>
                <td class="px-4 py-3 text-center">
                    <input type="checkbox" class="item-checkbox form-checkbox rounded text-primary" 
                        value="${item.id}" data-item='${JSON.stringify(item)}'>
                </td>
                <td class="px-4 py-3 text-sm">${item.po_number}</td>
                <td class="px-4 py-3 text-sm">${item.pr_number}</td>
                <td class="px-4 py-3 text-sm">${item.item_desc}</td>
                <td class="px-4 py-3 text-sm text-center">${item.uom}</td>
                <td class="px-4 py-3 text-sm text-right">${item.quantity}</td>
                <td class="px-4 py-3 text-sm">${statusBadge}</td>
            </tr>
        `;

        tbody.append(row);
    });

    $("#search-results").removeClass("hidden");

    // Setup checkbox events
    setupSearchCheckboxes();
}

/**
 * Select PO item for onsite
 */
function selectItem(item) {
    // Fill hidden input
    $("#selected-item-id").val(item.id);

    // Fill display info
    $("#info-po-number").text(item.po_number);
    $("#info-pr-number").text(item.pr_number);
    $("#info-supplier").text(item.supplier_name);
    $("#info-item-desc").text(item.item_desc);
    $("#info-uom").text(item.uom);
    $("#info-quantity").text(item.quantity);
    $("#info-sla-target").text(item.sla_po_to_onsite_target ? `${item.sla_po_to_onsite_target} hari` : '-');
    $("#info-approved-date").text(item.approved_date || '-').attr('data-date', item.approved_date);

    // Fill SLA target
    $("#sla_target").val(item.sla_po_to_onsite_target || '');

    // Show selected item info and form
    $("#selected-item-info").removeClass("hidden");
    $("#onsite-form").removeClass("hidden");

    // Hide search results
    $("#search-results").addClass("hidden");

    // Calculate SLA realization if onsite date already selected
    calculateSLARealization();

    showToast("Item berhasil dipilih!", "success", 1500);
}

/**
 * Calculate SLA Realization
 */
function calculateSLARealization() {
    const onsiteDateInput = $("#onsite_date").val();

    if (!onsiteDateInput || selectedItems.length === 0) {
        return;
    }

    // Update all selected items dengan kalkulasi SLA realization baru
    selectedItems.forEach((item) => {
        if (item.approved_date) {
            const startDate = convertDateFormat(item.approved_date);
            
            if (!startDate) {
                item.sla_realization = 0;
                return;
            }

            const workingDays = calculateWorkingDays(startDate, onsiteDateInput);
            item.sla_realization = workingDays;
        } else {
            item.sla_realization = 0;
        }
    });

    // Re-render tabel dengan data terbaru
    displaySelectedItems();
}

/**
 * Setup form submit
 */
function setupFormSubmit() {
    $("#form-create-onsite").on("submit", async function(e) {
        e.preventDefault();

        // Validasi ada item yang dipilih
        if (selectedItems.length === 0) {
            showToast("Pilih minimal 1 item PO terlebih dahulu", "warning", 2000);
            return;
        }

        // Validasi tanggal onsite
        const onsiteDate = $("#onsite_date").val();
        if (!onsiteDate) {
            showToast("Pilih tanggal onsite terlebih dahulu", "warning", 2000);
            return;
        }

        // Prepare data for multiple items
        const onsiteDateFormatted = convertDateFormat(onsiteDate);
        const items = selectedItems.map(item => {
            // Use calculated SLA from item object
            const slaValue = item.sla_realization || 0;
            return {
                purchase_order_items_id: item.id,
                onsite_date: onsiteDateFormatted,
                sla_po_to_onsite_realization: slaValue
            };
        });

        const btn = $("#btn-submit");
        const originalText = btn.html();
        btn.prop("disabled", true).html('<i class="mgc_loading_line animate-spin"></i> Menyimpan...');

        clearAllFieldErrors();

        try {
            // Loop untuk create multiple onsite
            let successCount = 0;
            let errorCount = 0;

            for (const itemData of items) {
                try {
                    await $.ajax({
                        url: route("po-onsite.store"),
                        method: "POST",
                        data: itemData,
                        headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
                    });
                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error('Error saving item:', error);
                }
            }

            if (successCount > 0) {
                showToast(`${successCount} data onsite berhasil disimpan!`, "success", 2000);
                setTimeout(() => {
                    window.location.href = route("po-onsite.index");
                }, 500);
            } else {
                throw new Error("Gagal menyimpan semua data");
            }
        } catch (error) {
            if (error.status === 422 && error.responseJSON?.errors) {
                displayFieldErrors(error.responseJSON.errors);
            }
            showError(error?.message || error?.responseJSON?.message || "Gagal menyimpan data onsite", "Gagal!");
            btn.prop("disabled", false).html(originalText);
        }
    });
}

/**
 * Convert date format from "Y-m-d" or "d-M-y" to "Y-m-d"
 */
function convertDateFormat(dateStr) {
    if (!dateStr) return null;

    // If already in Y-m-d format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // Try to parse as ISO date (e.g., "2020-01-25T00:00:00.000000Z")
    if (dateStr.includes('T') || dateStr.includes('Z')) {
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            console.error('Error parsing ISO date:', dateStr, e);
        }
    }

    // Parse d-M-y format (e.g., "25-Jan-20")
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const months = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };

        // Check if it's d-M-y format
        if (months[parts[1]]) {
            const day = parts[0].padStart(2, '0');
            const month = months[parts[1]];
            const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            return `${year}-${month}-${day}`;
        }
    }

    console.error('Unable to convert date format:', dateStr);
    return null;
}

/**
 * Format date to display format (d-M-y)
 */
function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr; // Return as-is if invalid
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const d = String(date.getDate()).padStart(2, '0');
        const m = months[date.getMonth()];
        const y = String(date.getFullYear()).slice(-2);
        
        return `${d}-${m}-${y}`;
    } catch (e) {
        return dateStr;
    }
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

/**
 * Setup checkbox events for search results
 */
function setupSearchCheckboxes() {
    // Select all checkbox
    $("#select-all-items").off("change").on("change", function() {
        const isChecked = $(this).is(":checked");
        $(".item-checkbox").prop("checked", isChecked);
        updateSelectButton();
    });

    // Individual checkboxes
    $(".item-checkbox").off("change").on("change", function() {
        const allChecked = $(".item-checkbox").length === $(".item-checkbox:checked").length;
        $("#select-all-items").prop("checked", allChecked);
        updateSelectButton();
    });
}

/**
 * Update select button visibility and count
 */
function updateSelectButton() {
    const checkedCount = $(".item-checkbox:checked").length;
    const btn = $("#btn-select-multiple");
    
    if (checkedCount > 0) {
        btn.removeClass("hidden");
        $("#selected-count").text(checkedCount);
    } else {
        btn.addClass("hidden");
    }
}

/**
 * Setup multiple selection button
 */
function setupMultipleSelection() {
    $("#btn-select-multiple").on("click", function() {
        const checkedItems = $(".item-checkbox:checked");
        
        if (checkedItems.length === 0) {
            showToast("Pilih minimal 1 item", "warning", 2000);
            return;
        }

        let addedCount = 0;
        let duplicateCount = 0;

        // Add selected items (check for duplicates)
        checkedItems.each(function() {
            const item = JSON.parse($(this).attr("data-item"));
            
            // Check if item already exists in selectedItems
            const exists = selectedItems.some(selected => selected.id === item.id);
            
            if (!exists) {
                selectedItems.push(item);
                addedCount++;
            } else {
                duplicateCount++;
            }
        });

        // Display selected items in datatable
        displaySelectedItems();
        
        // Hide search results
        $("#search-results").addClass("hidden");
        
        // Show selected items section and form
        $("#selected-item-info").removeClass("hidden");
        $("#onsite-form").removeClass("hidden");

        // If onsite date already chosen, compute SLA values per item
        if ($("#onsite_date").val()) {
            calculateSLARealization();
        }

        // Show toast message
        if (duplicateCount > 0) {
            showToast(`${addedCount} item ditambahkan, ${duplicateCount} item sudah ada`, "info", 2000);
        } else {
            showToast(`${addedCount} item berhasil ditambahkan!`, "success", 1500);
        }
    });
}

/**
 * Display selected items in datatable
 */
function displaySelectedItems() {
    const tbody = $("#selected-items-body");
    tbody.empty();

    selectedItems.forEach((item, index) => {
        const approvedDateFormatted = item.approved_date ? formatDateDisplay(item.approved_date) : '-';
        const slaTarget = item.sla_po_to_onsite_target ? `${item.sla_po_to_onsite_target} hari` : '-';
        const slaRealization = item.sla_realization !== undefined && item.sla_realization !== null ? item.sla_realization : '-';
        const slaDisplay = slaRealization !== '-' ? `${slaRealization} hari` : '-';
        const formatRupiah = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        const row = `
            <tr>
            <td class="px-3 py-2 text-sm">${index + 1}</td>
            <td class="px-3 py-2 text-sm font-semibold text-primary">${item.po_number}</td>
            <td class="px-3 py-2 text-sm">${item.pr_number}</td>
            <td class="px-3 py-2 text-sm">${item.supplier_name}</td>
            <td class="px-3 py-2 text-sm">${item.item_desc}</td>
            <td class="px-3 py-2 text-sm text-center">${item.uom}</td>
            <td class="px-3 py-2 text-sm text-right">${item.quantity}</td>
            <td class="px-3 py-2 text-sm text-right">${formatRupiah(item.amount)}</td>
            <td class="px-3 py-2 text-sm text-center text-slate-600 dark:text-slate-400">${approvedDateFormatted}</td>
            <td class="px-3 py-2 text-sm text-center">
                <span class="font-semibold text-slate-700 dark:text-slate-300" data-id="${item.id}">
                    ${slaTarget}
                </span>
            </td>
            <td class="px-3 py-2 text-sm text-center">
                <span class="sla-display font-semibold text-primary" data-id="${item.id}">
                    ${slaDisplay}
                </span>
            </td>
            <td class="px-3 py-2 text-center">
            <button type="button" class="btn-remove-item btn btn-xs bg-danger text-white hover:bg-danger-600" 
            data-index="${index}">
            <i class="mgc_delete_2_line"></i>
            </button>
            </td>
            </tr>
        `;
        tbody.append(row);
    });

    $("#selected-items-count").text(selectedItems.length);

    // Setup remove button
    $(".btn-remove-item").on("click", function() {
        const index = $(this).data("index");
        removeSelectedItem(index);
    });
}

/**
 * Remove item from selection
 */
function removeSelectedItem(index) {
    selectedItems.splice(index, 1);
    
    if (selectedItems.length === 0) {
        $("#selected-item-info").addClass("hidden");
        $("#onsite-form").addClass("hidden");
        showToast("Semua item telah dihapus", "info", 1500);
    } else {
        displaySelectedItems();
        showToast("Item berhasil dihapus", "success", 1500);
    }
}

/**
 * Setup clear selection button
 */
function setupClearSelection() {
    $("#btn-clear-selection").on("click", async function() {
        if (selectedItems.length === 0) return;
        
        const confirmed = await confirmAction(
            `Anda akan menghapus semua ${selectedItems.length} item yang sudah dipilih. Tindakan ini tidak dapat dibatalkan.`,
            'Hapus Semua Item?'
        );

        if (confirmed) {
            selectedItems = [];
            $("#selected-item-info").addClass("hidden");
            $("#onsite-form").addClass("hidden");
            showToast("Semua item telah dihapus", "info", 1500);
        }
    });
}

export default initOnsiteCreate;
