/**
 * Modul Purchase Order - Create
 * Mengelola form create purchase order dengan dynamic items
 */
import flatpickr from 'flatpickr';
import AutoNumeric from 'autonumeric';
import { showSuccess, showError, showWarning,confirmAction } from '../../../core/notification';
import { route } from 'ziggy-js';
import $ from "jquery";
import NiceSelect from "nice-select2/src/js/nice-select2.js";

let itemCounter = 0;
let autoNumericInstances = {};
let prCache = [];

/**
 * Calculate working days (Monday-Friday) between two dates
 * @param {Date|string} startDate - Start date (Y-m-d or Date object)
 * @param {Date|string} endDate - End date (Y-m-d or Date object), default is today
 * @returns {number} Number of working days
 */
function calculateWorkingDays(startDate, endDate = null) {
    // Parse dates
    let start = typeof startDate === 'string' ? new Date(startDate + 'T00:00:00') : new Date(startDate);
    let end = endDate ? (typeof endDate === 'string' ? new Date(endDate + 'T00:00:00') : new Date(endDate)) : new Date();

    // Reset time to start of day for accurate comparison
    start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    end = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    let workingDays = 0;
    let currentDate = new Date(start);

    // Iterate through each day from start to end
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        // Count only Monday (1) to Friday (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
}

/**
 * Format number as Indonesian currency without symbol
 */
function formatCurrencyID(value) {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value) || 0;
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format Y-m-d to d-M-yy (locale id-ID)
 */
function formatDateID(value) {
    if (!value) return '-';
    try {
        const d = new Date(value + 'T00:00:00');
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        }).format(d);
    } catch (e) {
        return value;
    }
}

$(document).ready(function() {
    // searchable
    $('#supplier_id').each(function() {
        new NiceSelect(this, {
            searchable: true
        });
    });
});

/**
 * Inject custom CSS styles untuk input[type="number"] spinner buttons
 */
function injectCustomStyles() {
    if (document.querySelector('style[data-po-create]')) return;
    const styles = `
input[type="number"].po-item-quantity{padding-right:0 !important;}
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button{
    -webkit-appearance:none;
    margin:0;
    padding:0;
    width:40px;
    height:100%;
    background:#f3f4f6;
    border-left:1px solid #e5e7eb;
    cursor:pointer;
}
input[type="number"]::-webkit-outer-spin-button{border-bottom:1px solid #e5e7eb;}
input[type="number"]::-webkit-inner-spin-button{border-top:1px solid #e5e7eb;}
input[type="number"]{-moz-appearance:textfield;}
`;
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-po-create', 'true');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}
export function initPOCreate() {
    if (!$("#form-create-po").length) return;

    injectCustomStyles();
    setupFlatpickr();
    setupFormSubmit();
    setupDynamicItems();
    setupPrPicker();
    setupRequestTypeListener();
    
    // Start with empty table - user can pick from PR or add manually
}

/**
 * Setup Flatpickr for date picker
 */
function setupFlatpickr() {
    flatpickr("#approved_date", {
        altInput: true,
        altFormat: "d-M-y",
        dateFormat: "Y-m-d",
        allowInput:true,
        locale: {
            firstDayOfWeek: 1
        },
        onChange: function(selectedDates, dateStr, instance) {
            // Validate PO date against all PR dates
            if (!validatePODateAgainstPRDates(dateStr)) {
                // Invalid date detected, validation function already handled the error
                return;
            }
            
            // Recalculate SLA Realisasi when PO approved_date changes
            recalculateSLARealisasi(dateStr);
        }
    });
}

/**
 * Validate PO approved_date tidak boleh lebih kecil dari PR approved_date
 * Returns false jika ada konflik dan clear PO date
 */
function validatePODateAgainstPRDates(poDateStr) {
    if (!poDateStr || poDateStr.trim() === '') return true;
    
    const poDate = new Date(poDateStr + 'T00:00:00');
    let hasConflict = false;
    let conflictingPRNumber = '';
    let conflictingPRDate = '';
    
    // Check semua PR dates yang sudah ada di items
    $('#po-items-container .po-item-row').each(function() {
        const $row = $(this);
        const prApprovedDate = $row.find('.po-pr-approved-date').attr('data-pr-approved-date');
        const prNumber = $row.find('.po-pr-number').val();
        
        if (prApprovedDate && prApprovedDate.trim() !== '') {
            const prDate = new Date(prApprovedDate + 'T00:00:00');
            
            // Jika PO date < PR date, ini konflik
            if (poDate < prDate) {
                hasConflict = true;
                conflictingPRNumber = prNumber;
                conflictingPRDate = prApprovedDate;
                return false; // Break loop
            }
        }
    });
    
    if (hasConflict) {
        // Clear PO approved_date
        $('#approved_date').val('');
        const approvedDateInput = document.querySelector('#approved_date');
        if (approvedDateInput && approvedDateInput._flatpickr) {
            approvedDateInput._flatpickr.clear();
        }
        
        // Show warning and focus
        showWarning(`⚠️ Tanggal PO Approve (${poDateStr}) tidak boleh lebih kecil dari tanggal PR Approve (${conflictingPRDate}) pada PR ${conflictingPRNumber}. Silakan isi kembali tanggal PO Approve yang valid.`);
        
        // Focus to approved_date input
        setTimeout(() => {
            $('#approved_date').focus();
        }, 100);
        
        // Clear all SLA Realisasi
        recalculateSLARealisasi('');
        
        return false;
    }
    
    return true;
}

/**
 * Recalculate SLA Realisasi for all items when PO approved_date changes
 */
function recalculateSLARealisasi(poApprovedDate) {
    // Clear all SLA Realisasi if PO date is empty
    if (!poApprovedDate || poApprovedDate.trim() === '') {
        $('#po-items-container .po-item-row').each(function() {
            $(this).find('input[name*="sla_pr_to_po_realization"]').val('');
        });
        return;
    }

    // Recalculate for each item row
    $('#po-items-container .po-item-row').each(function() {
        const $row = $(this);
        const prApprovedDate = $row.find('.po-pr-approved-date').attr('data-pr-approved-date');

        // Only calculate if item has PR data
        if (prApprovedDate && prApprovedDate.trim() !== '') {
            const workingDays = calculateWorkingDays(prApprovedDate, poApprovedDate);
            $row.find('input[name*="sla_pr_to_po_realization"]').val(workingDays);
        } else {
            // Clear if no PR date
            $row.find('input[name*="sla_pr_to_po_realization"]').val('');
        }
    });
}

/**
 * Setup dynamic items (add/remove rows)
 */
function setupDynamicItems() {
    // Remove item button (delegated)
    $(document).on("click", ".po-btn-remove-item", function() {
        const row = $(this).closest("tr");
        
        // Remove row and rebuild AutoNumeric instances
        row.remove();
        rebuildAutoNumericInstances();
        renumberItems();
        
        // Show empty state if no items left
        checkAndShowEmptyState();
        
        // Check if request_type should be enabled again
        checkRequestTypeReadonly();
        
        // Re-render PR list to show newly available PRs/items
        if (prCache.length > 0) {
            renderPrList(prCache);
        }
    });

    // Quantity change - calculate amount
    $(document).on("input", ".po-item-quantity", function() {
        const $row = $(this).closest("tr");
        calculateRowAmount($row);
    });

    // Item checkboxes
    setupItemCheckboxes();
    
    // Delete selected items button
    $(document).on('click', '#btn-delete-selected-items', function() {
        deleteSelectedItems();
    });
}

/**
 * Setup item checkboxes for bulk selection
 */
function setupItemCheckboxes() {
    // Select all checkbox
    $(document).off('change', '#item-select-all').on('change', '#item-select-all', function() {
        const isChecked = $(this).prop('checked');
        $('.item-checkbox').prop('checked', isChecked);
        updateItemDeleteButton();
    });

    // Individual checkboxes
    $(document).off('change', '.item-checkbox').on('change', '.item-checkbox', function() {
        const totalCheckboxes = $('.item-checkbox').length;
        const checkedCheckboxes = $('.item-checkbox:checked').length;
        $('#item-select-all').prop('checked', totalCheckboxes === checkedCheckboxes);
        updateItemDeleteButton();
    });
}

/**
 * Update delete items button visibility
 */
function updateItemDeleteButton() {
    const selectedCount = $('.item-checkbox:checked').length;
    const $deleteBtn = $('#btn-delete-selected-items');
    
    if (selectedCount > 0) {
        $deleteBtn.removeClass('hidden');
        $('#selected-items-count').text(selectedCount);
    } else {
        $deleteBtn.addClass('hidden');
    }
}

/**
 * Delete selected items
 */
async function deleteSelectedItems() {
    const selectedRows = $('.item-checkbox:checked').closest('tr');
    const selectedCount = selectedRows.length;
    
    if (selectedCount === 0) {
        showWarning('Pilih minimal 1 item untuk dihapus');
        return;
    }

    const confirmed = await confirmAction(
        `Apakah Anda yakin ingin menghapus ${selectedCount} item terpilih?`,
        'Konfirmasi Hapus'
    );

    if (!confirmed) return;

    // Remove selected rows
    selectedRows.remove();
    
    // Rebuild AutoNumeric instances and renumber
    rebuildAutoNumericInstances();
    renumberItems();
    
    // Reset checkboxes
    $('#item-select-all').prop('checked', false);
    updateItemDeleteButton();
    
    // Show empty state if no items left
    checkAndShowEmptyState();
    
    // Check if request_type should be enabled again
    checkRequestTypeReadonly();
    
    // Re-render PR list to show newly available PRs/items
    if (prCache.length > 0) {
        renderPrList(prCache);
    }
    
    showSuccess(`${selectedCount} item berhasil dihapus`);
}

/**
 * Setup request type listener untuk enable/disable button dan readonly logic
 */
function setupRequestTypeListener() {
    $('#request_type').on('change', function() {
        const selectedType = $(this).val();
        const $btnPickPr = $('#btn-pick-pr');
        const itemRows = $('#po-items-container tr').not('.text-center.text-gray-500');
        
        if (selectedType) {
            // Enable button jika type sudah dipilih
            $btnPickPr.prop('disabled', false);
            
            // Jika ada items, set type to readonly
            if (itemRows.length > 0) {
                $('#request_type').prop('disabled', true);
            }
        } else {
            // Disable button jika type belum dipilih
            $btnPickPr.prop('disabled', true);
        }
    });
}

/**
 * Check if request type should be readonly
 */
function checkRequestTypeReadonly() {
    const itemRows = $('#po-items-container tr').not('.text-center.text-gray-500');
    const $requestType = $('#request_type');
    
    if (itemRows.length > 0) {
        // Ada items, set readonly
        $requestType.prop('disabled', true);
    } else {
        // Tidak ada items, enable kembali
        $requestType.prop('disabled', false);
    }
}

/**
 * Setup PR picker modal and load PR list
 */
function setupPrPicker() {
    $(document).on('click', '#btn-pick-pr', async function() {
        await loadPrList();
        showPrModal();
    });

    $(document).on('click', '#btn-close-pr-modal', function() {
        hidePrModal();
    });

    $(document).on('click', '.btn-select-pr', function() {
        const prId = $(this).data('pr-id');
        const selected = prCache.find(p => p.id === prId);
        if (!selected) {
            showError('PR tidak ditemukan');
            return;
        }
        populateItemsFromPR(selected);
        hidePrModal();
    });
}

/**
 * Load PR list with items for current prefix and filter by request_type
 */
async function loadPrList() {
    try {
        const selectedType = $('#request_type').val();
        
        if (!selectedType) {
            showWarning('Pilih Request Type terlebih dahulu');
            return;
        }
        
        const response = await fetch(route('purchase-order.pr-list'), {
            headers: { Accept: 'application/json' }
        });
        const data = await response.json();
        if (!response.ok) {
            showError(data.message || 'Gagal memuat PR');
            return;
        }
        
        // Filter PR by selected request_type
        prCache = (data.data || []).filter(pr => pr.request_type === selectedType);
        
        if (prCache.length === 0) {
            showWarning(`Tidak ada PR dengan tipe "${selectedType}" yang tersedia`);
            hidePrModal();
            return;
        }
        
        renderPrList(prCache);
    } catch (error) {
        console.error(error);
        showError('Gagal memuat PR');
    }
}

// Store the full PR list and pagination state for searching
let fullPrList = [];
let currentPrPage = 1;
let prPageSize = 10;
let filteredPrList = [];

function renderPrList(list) {
    // Store full list for search functionality
    fullPrList = list;
    
    // Get existing pr_item_ids in the table
    const existingPrItemIds = [];
    $('#po-items-container .po-pr-item-id').each(function() {
        const val = $(this).val();
        if (val) existingPrItemIds.push(parseInt(val));
    });

    // Filter PRs and calculate available items count
    filteredPrList = list.map(pr => {
        const availableItems = pr.items.filter(item => !existingPrItemIds.includes(item.id));
        return {
            ...pr,
            available_items_count: availableItems.length
        };
    }).filter(pr => pr.available_items_count > 0);

    // Reset to first page when loading new list
    currentPrPage = 1;
    
    // Update total count
    $('#pr-total').text(filteredPrList.length);

    if (!filteredPrList.length) {
        $('#pr-list-body').html('<tr><td colspan="5" class="px-3 py-3 text-center text-gray-500">Semua item dari PR sudah ditambahkan ke tabel</td></tr>');
        $('#pr-count').text(0);
        updatePrPaginationControls();
        return;
    }

    // Render first page
    renderPrPage(currentPrPage);
    setupPrSearch();
    setupPrPaginationButtons();
}

function renderPrPage(pageNum) {
    const startIdx = (pageNum - 1) * prPageSize;
    const endIdx = startIdx + prPageSize;
    const displayedPrs = filteredPrList.slice(startIdx, endIdx);

    const $body = $('#pr-list-body');
    $body.empty();

    if (!displayedPrs.length) {
        $body.append('<tr><td colspan="6" class="px-3 py-3 text-center text-gray-500">Tidak ada PR yang sesuai</td></tr>');
        return;
    }

    displayedPrs.forEach(pr => {
        const availableCount = pr.available_items_count || 0;
        const locationName = pr.location_name || '-';
        const formattedDate = pr.formatted_approved_date || '-';
        const requestType = pr.request_type || '';
        const requestTypeBadge = requestType 
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${requestType === 'barang' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'}">${requestType.charAt(0).toUpperCase() + requestType.slice(1)}</span>`
            : '-';
        
        $body.append(`
            <tr class="border-b last:border-0 pr-row" data-pr-number="${pr.pr_number}" data-location="${locationName}">
                <td class="px-3 py-2 font-semibold text-gray-800 dark:text-gray-100">${pr.pr_number}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300">${requestTypeBadge}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300">${locationName}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300">${formattedDate}</td>
                <td class="px-3 py-2 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <i class="mgc_check_line"></i>
                        ${availableCount} tersedia
                    </span>
                </td>
                <td class="px-3 py-2 text-center">
                    <button type="button" class="btn btn-sm bg-primary text-white hover:bg-primary-600 btn-select-pr" data-pr-id="${pr.id}">
                        Pilih
                    </button>
                </td>
            </tr>
        `);
    });

    // Update display counters
    $('#pr-count').text(displayedPrs.length);
    updatePrPaginationControls();
}

function updatePrPaginationControls() {
    const totalPages = Math.ceil(filteredPrList.length / prPageSize) || 1;
    
    $('#pr-current-page').text(currentPrPage);
    $('#pr-total-pages').text(totalPages);
    $('#pr-per-page').text(prPageSize);
    
    // Enable/disable buttons
    $('#btn-pr-prev').prop('disabled', currentPrPage <= 1);
    $('#btn-pr-next').prop('disabled', currentPrPage >= totalPages);
}

function setupPrSearch() {
    $(document).off('input', '#pr-search-input').on('input', '#pr-search-input', function() {
        const searchTerm = $(this).val().toLowerCase().trim();
        
        if (!searchTerm) {
            // Show all available PRs
            const existingPrItemIds = [];
            $('#po-items-container .po-pr-item-id').each(function() {
                const val = $(this).val();
                if (val) existingPrItemIds.push(parseInt(val));
            });

            filteredPrList = fullPrList.map(pr => {
                const availableItems = pr.items.filter(item => !existingPrItemIds.includes(item.id));
                return {
                    ...pr,
                    available_items_count: availableItems.length
                };
            }).filter(pr => pr.available_items_count > 0);
        } else {
            // Filter by PR number or location, then filter by availability
            const existingPrItemIds = [];
            $('#po-items-container .po-pr-item-id').each(function() {
                const val = $(this).val();
                if (val) existingPrItemIds.push(parseInt(val));
            });

            filteredPrList = fullPrList.filter(pr => {
                const prNumber = (pr.pr_number || '').toLowerCase();
                const location = (pr.location_name || '').toLowerCase();
                return prNumber.includes(searchTerm) || location.includes(searchTerm);
            }).map(pr => {
                const availableItems = pr.items.filter(item => !existingPrItemIds.includes(item.id));
                return {
                    ...pr,
                    available_items_count: availableItems.length
                };
            }).filter(pr => pr.available_items_count > 0);
        }
        
        // Reset to first page on search
        currentPrPage = 1;
        $('#pr-total').text(filteredPrList.length);
        renderPrPage(currentPrPage);
    });
}

// Setup pagination button listeners
function setupPrPaginationButtons() {
    $(document).off('click', '#btn-pr-prev').on('click', '#btn-pr-prev', function() {
        if (currentPrPage > 1) {
            currentPrPage--;
            renderPrPage(currentPrPage);
            $('#pr-list-body').closest('.overflow-x-auto').scrollTop(0);
        }
    });

    $(document).off('click', '#btn-pr-next').on('click', '#btn-pr-next', function() {
        const totalPages = Math.ceil(filteredPrList.length / prPageSize);
        if (currentPrPage < totalPages) {
            currentPrPage++;
            renderPrPage(currentPrPage);
            $('#pr-list-body').closest('.overflow-x-auto').scrollTop(0);
        }
    });
}

function showPrModal() {
    $('#modal-pick-pr').removeClass('hidden');
}

function hidePrModal() {
    $('#modal-pick-pr').addClass('hidden');
}

function populateItemsFromPR(pr) {
    if (!pr || !Array.isArray(pr.items)) {
        showWarning('PR tidak memiliki item');

            // Validasi PR approved_date vs PO approved_date
            const poDateStr = $('#approved_date').val().trim();
            if (poDateStr && pr.approved_date_raw) {
                const poDate = new Date(poDateStr + 'T00:00:00');
                const prDate = new Date(pr.approved_date_raw + 'T00:00:00');
        
                // Jika PR date > PO date, clear PO date dan minta user isi ulang
                if (prDate > poDate) {
                    // Clear PO approved_date
                    $('#approved_date').val('');
                    const approvedDateInput = document.querySelector('#approved_date');
                    if (approvedDateInput && approvedDateInput._flatpickr) {
                        approvedDateInput._flatpickr.clear();
                    }
            
                    // Show warning and focus
                    showWarning(`⚠️ Tanggal PR Approve (${pr.approved_date_raw}) pada PR ${pr.pr_number} lebih besar dari tanggal PO Approve (${poDateStr}). Silakan isi kembali tanggal PO Approve yang valid (minimal ${pr.approved_date_raw}).`);
            
                    // Focus to approved_date input
                    setTimeout(() => {
                        $('#approved_date').focus();
                    }, 100);
            
                    // Clear all SLA Realisasi
                    recalculateSLARealisasi('');
                }
            }
        return;
    }

    // Remove empty state row if exists
    $('#po-items-container tr.text-center.text-gray-500').remove();

    // Get existing pr_item_ids to prevent duplicates
    const existingPrItemIds = [];
    $('#po-items-container .po-pr-item-id').each(function() {
        const val = $(this).val();
        if (val) existingPrItemIds.push(parseInt(val));
    });

    let addedCount = 0;
    pr.items.forEach(item => {
        // Skip if this pr_item_id already exists in table
        if (existingPrItemIds.includes(item.id)) {
            return;
        }
        
        addItemRow({
            id: item.id,
            pr_number: pr.pr_number,
            item_desc: item.item_desc,
            uom: item.uom,
            unit_price: item.unit_price,
            quantity: item.quantity,
            amount: item.amount,
            cost_saving: item.cost_saving ?? 0,
            approved_date: pr.approved_date_raw, // PR's approved date in Y-m-d format for SLA calculation
        });
        addedCount++;
    });

    if (addedCount === 0) {
        showWarning(`Semua item dari PR ${pr.pr_number} sudah ada dalam tabel`);
        return;
    }

    // Re-render PR list to update available counts
    renderPrList(prCache);

    renumberItems();
    $('#item-select-all').prop('checked', false);
    updateItemDeleteButton();
    
    // Show approved date field setelah PR dimuat
    $('#approved-date-container').removeClass('hidden');
    
    // Set request_type to readonly setelah items ditambahkan
    checkRequestTypeReadonly();
    
    showSuccess(`${addedCount} item dari PR ${pr.pr_number} berhasil ditambahkan`);
}

/**
 * Add new item row
 */
function addItemRow(prItem = null) {
    const template = $("#po-item-row-template").html();
    const $row = $(template);
    
    // Update row index
    const newIndex = itemCounter++;
    // Assign a stable row id to avoid index shifting issues
    $row.attr('data-row-id', newIndex);
    $row.find("input, select").each(function() {
        const name = $(this).attr("name");
        if (name) {
            const newName = name.replace(/\[\d+\]/, `[${newIndex}]`);
            $(this).attr("name", newName);
        }
    });

    $("#po-items-container").append($row);
    
    // Initialize AutoNumeric for currency fields in this row
    const rowId = $row.attr('data-row-id');
    // Select the correct visible inputs (exclude hidden pr_amount)
    const unitPriceInput = $row.find('input[name$="[unit_price]"]')[0];
    const amountInput = $row.find('input[name$="[amount]"]')[0];
    const prItemIdInput = $row.find('.po-pr-item-id')[0];
    const prDescInput = $row.find('.po-pr-desc')[0];
    const prUomInput = $row.find('.po-pr-uom')[0];
    const prAmountInput = $row.find('.po-pr-amount')[0];
    const prUnitPriceDisplay = $row.find('.po-pr-unit-price-display');
    const prQtyDisplay = $row.find('.po-pr-qty-display');
    const prAmountDisplay = $row.find('.po-pr-amount-display');
    
    if (unitPriceInput) {
        autoNumericInstances[`unit_price_${rowId}`] = new AutoNumeric(unitPriceInput, {
            currencySymbol: '',
            currencySymbolPlacement: 's',
            decimalCharacter: ',',
            digitGroupSeparator: '.',
            decimalPlaces: 0,
            unformatOnSubmit: true,
            minimumValue: '0',
        });
        
        // Listen to changes on unit price (AutoNumeric & native events)
        $(unitPriceInput).on('input keyup blur autoNumeric:rawValueModified', function() {
            calculateRowAmount($row);
        });
        if (prItem?.unit_price) {
            autoNumericInstances[`unit_price_${rowId}`].set(prItem.unit_price);
        }
    }
    
    if (amountInput) {
        autoNumericInstances[`amount_${rowId}`] = new AutoNumeric(amountInput, {
            currencySymbol: '',
            currencySymbolPlacement: 's',
            decimalCharacter: ',',
            digitGroupSeparator: '.',
            decimalPlaces: 0,
            unformatOnSubmit: true,
            minimumValue: '0',
        });
        if (prItem?.amount) {
            autoNumericInstances[`amount_${rowId}`].set(prItem.amount);
        }
    }

    // Store PR amount for cost_saving calculation
    if (prAmountInput && prItem?.amount) {
        $(prAmountInput).val(prItem.amount);
    }

    // Populate PR comparison displays
    if (prUnitPriceDisplay && prItem?.unit_price !== undefined) {
        prUnitPriceDisplay.text(formatCurrencyID(prItem.unit_price));
    }
    if (prQtyDisplay && prItem?.quantity !== undefined) {
        prQtyDisplay.text(prItem.quantity);
    }
    if (prAmountDisplay && prItem?.amount !== undefined) {
        prAmountDisplay.text(formatCurrencyID(prItem.amount));
    }

    // Populate PR linked data
    if (prItemIdInput) {
        $(prItemIdInput).val(prItem?.id ?? '');
    }
    if (prDescInput) {
        $(prDescInput).val(prItem?.item_desc ?? '');
    }
    if (prUomInput) {
        $(prUomInput).val(prItem?.uom ?? '');
    }
    
    // Populate PR number
    const prNumberInput = $row.find('.po-pr-number')[0];
    const prNumberDisplay = $row.find('.po-pr-number-display');
    if (prNumberInput && prItem?.pr_number) {
        $(prNumberInput).val(prItem.pr_number);
    }
    if (prNumberDisplay.length && prItem?.pr_number) {
        prNumberDisplay.text(prItem.pr_number).removeClass('text-gray-400').addClass('text-blue-600 dark:text-blue-400');
    }
    
    if (prItem?.quantity) {
        $row.find('.po-item-quantity').val(prItem.quantity);
    }

    // Store PR's approved_date in data attribute for SLA calculation
    if (prItem?.approved_date) {
        $row.find('.po-pr-approved-date').attr('data-pr-approved-date', prItem.approved_date);
        // Show PR approved date on row
        $row.find('.po-pr-approved-date-display').text(formatDateID(prItem.approved_date));
    }

    // Populate SLA Target dan SLA Realisasi jika ada (untuk restored data)
    if (prItem?.sla_pr_to_po_target !== undefined && prItem?.sla_pr_to_po_target !== null) {
        $row.find('input[name*="sla_pr_to_po_target"]').val(prItem.sla_pr_to_po_target);
    }
    
    if (prItem?.sla_pr_to_po_realization !== undefined && prItem?.sla_pr_to_po_realization !== null) {
        $row.find('input[name*="sla_pr_to_po_realization"]').val(prItem.sla_pr_to_po_realization);
    } else {
        // Hitung SLA Realisasi saat item ditambahkan (untuk data baru dari PR)
        const poApprovedDate = $("#approved_date").val().trim();
        if (poApprovedDate && prItem?.approved_date) {
            const slaRealization = calculateWorkingDays(prItem.approved_date, poApprovedDate);
            $row.find('input[name*="sla_pr_to_po_realization"]').val(slaRealization);
        }
    }

    // Ensure amount recalculated when PR data is applied
    calculateRowAmount($row);

    renumberItems();
}

/**
 * Rebuild AutoNumeric instances after row deletion
 */
function rebuildAutoNumericInstances() {
    // Remove all existing instances with error handling
    Object.keys(autoNumericInstances).forEach(key => {
        try {
            if (autoNumericInstances[key]) {
                autoNumericInstances[key].remove();
            }
        } catch (e) {
            // Silently handle AutoNumeric removal errors
            console.warn('AutoNumeric removal warning:', e.message);
        }
    });

    // Clear the instances object
    autoNumericInstances = {};

    // Recreate instances for all remaining rows
    $("#po-items-container tr").each(function(index) {
        const $row = $(this);
        // Ensure row has a stable id
        let rowId = $row.attr('data-row-id');
        if (!rowId) {
            rowId = ++itemCounter;
            $row.attr('data-row-id', rowId);
        }
        const unitPriceInput = $row.find('input[name$="[unit_price]"]')[0];
        const amountInput = $row.find('input[name$="[amount]"]')[0];

        // Skip if no inputs found (e.g., empty state row)
        if (!unitPriceInput) return;

        if (unitPriceInput) {
            // Check if AutoNumeric already exists on this element
            const existingInstance = AutoNumeric.getAutoNumericElement(unitPriceInput);
            if (existingInstance) {
                autoNumericInstances[`unit_price_${rowId}`] = existingInstance;
            } else {
                autoNumericInstances[`unit_price_${rowId}`] = new AutoNumeric(unitPriceInput, {
                    currencySymbol: '',
                    currencySymbolPlacement: 's',
                    decimalCharacter: ',',
                    digitGroupSeparator: '.',
                    decimalPlaces: 0,
                    unformatOnSubmit: true,
                    minimumValue: '0',
                });
            }

            // Remove old event handlers and add new one
            $(unitPriceInput).off('input keyup blur autoNumeric:rawValueModified change')
                .on('input keyup blur autoNumeric:rawValueModified change', function() {
                calculateRowAmount($row);
            });
        }

        if (amountInput) {
            const existingInstance = AutoNumeric.getAutoNumericElement(amountInput);
            if (existingInstance) {
                autoNumericInstances[`amount_${rowId}`] = existingInstance;
            } else {
                autoNumericInstances[`amount_${rowId}`] = new AutoNumeric(amountInput, {
                    currencySymbol: '',
                    currencySymbolPlacement: 's',
                    decimalCharacter: ',',
                    digitGroupSeparator: '.',
                    decimalPlaces: 0,
                    unformatOnSubmit: true,
                    minimumValue: '0',
                });
            }
        }
    });
}

/**
 * Renumber items after add/remove
 */
function renumberItems() {
    $("#po-items-container tr").each(function(index) {
        // Skip empty state row
        if ($(this).hasClass('text-gray-500')) return;
        $(this).find(".po-item-number").text(index + 1);
    });
}

/**
 * Check and show empty state if no items
 */
function checkAndShowEmptyState() {
    const itemRows = $('#po-items-container tr').not('.text-center.text-gray-500');
    
    if (itemRows.length === 0) {
        // No items, show empty state
        const emptyStateHtml = `
            <tr class="text-center text-gray-500">
                <td colspan="12" class="py-8">
                    <i class="mgc_inbox_line text-3xl mb-2"></i>
                    <p class="font-semibold">Klik "Ambil Data PR" untuk memuat items dari Purchase Request</p>
                    <p class="text-sm mt-1 text-amber-600 dark:text-amber-400">⚠️ Items harus diambil dari PR (minimal 1 item)</p>
                </td>
            </tr>
        `;
        $('#po-items-container').html(emptyStateHtml);
        
        // Hide approved date field jika tidak ada items
        $('#approved-date-container').addClass('hidden');
        $('#approved_date').val('');
        const approvedDateInput = document.querySelector('#approved_date');
        if (approvedDateInput && approvedDateInput._flatpickr) {
            approvedDateInput._flatpickr.clear();
        }
        
        // Enable request_type when no items
        checkRequestTypeReadonly();
        
        // Re-render PR list to show all available PRs
        if (prCache.length > 0) {
            renderPrList(prCache);
        }
    }
}

/**
 * Display field-level validation errors
 */
function displayFieldErrors(errors) {
    Object.keys(errors).forEach(field => {
        const errorEl = $(`#error-${field}`);
        if (errorEl.length) {
            errorEl.text(errors[field][0]).removeClass('hidden');
        }
    });
}

/**
 * Clear error for specific field
 */
function clearFieldError(fieldName) {
    $(`#error-${fieldName}`).text('').addClass('hidden');
}

/**
 * Clear all field errors
 */
function clearAllFieldErrors() {
    $('[id^="error-"]').text('').addClass('hidden');
}

/**
 * Calculate amount for a row (quantity × unit_price)
 */
function calculateRowAmount($row) {
    const rowId = $row.attr('data-row-id');
    const quantity = parseFloat($row.find(".po-item-quantity").val()) || 0;
    
    const unitPriceInstance = autoNumericInstances[`unit_price_${rowId}`];
    const amountInstance = autoNumericInstances[`amount_${rowId}`];
    
    if (!unitPriceInstance || !amountInstance) return;
    
    const unitPrice = unitPriceInstance.getNumber() || 0;
    const amount = quantity * unitPrice;
    
    amountInstance.set(amount);
}

/**
 * Setup form submit
 */
function setupFormSubmit() {
    $("#form-create-po").on("submit", async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearAllFieldErrors();
        
        // Validate form
        const validation = validateForm();
        if (!validation.isValid) {
            showError(validation.message);
            return;
        }

        // Confirm before submit
        const confirmed = await confirmAction(
            "Data purchase order akan disimpan ke sistem.",
            "Konfirmasi Simpan"
        );
        
        if (!confirmed) return;

        const btn = $(this).find('button[type="submit"]');
        const originalText = btn.html();
        btn.prop("disabled", true).html('<i class="mgc_loading_line animate-spin me-2"></i>Menyimpan...');

        try {
            const formData = new FormData(this);
            
            // Collect items (exclude empty state row)
            const items = [];
            const itemRows = $("#po-items-container tr").not('.text-center.text-gray-500');
            
            itemRows.each(function(index) {
                const $r = $(this);
                const rowId = $r.attr('data-row-id');
                const unitPriceInstance = autoNumericInstances[`unit_price_${rowId}`];
                const amountInstance = autoNumericInstances[`amount_${rowId}`];
                
                const unitPrice = unitPriceInstance ? unitPriceInstance.getNumber() : 0;
                const amount = amountInstance ? amountInstance.getNumber() : 0;
                const prAmount = parseFloat($r.find('.po-pr-amount').val()) || 0;
                
                items.push({
                    purchase_request_item_id: $r.find('.po-pr-item-id').val() || null,
                    pr_amount: prAmount,
                    unit_price: unitPrice,
                    quantity: parseInt($r.find('.po-item-quantity').val()) || 0,
                    amount: amount,
                    sla_po_to_onsite_target: $r.find('input[name*="sla_po_to_onsite_target"]').val() || null,
                    sla_pr_to_po_realization: $r.find('input[name*="sla_pr_to_po_realization"]').val() || null,
                });
            });

            formData.append('items', JSON.stringify(items));

            const response = await fetch($(this).attr('action'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    displayFieldErrors(data.errors);
                }
                showError(data.message || 'Gagal menyimpan PO');
                return;
            }

            showSuccess('PO berhasil disimpan');
            window.location.href = route('purchase-order.index');

        } catch (error) {
            console.error('Error:', error);
            showError('Terjadi kesalahan: ' + error.message);
        } finally {
            btn.prop("disabled", false).html(originalText);
        }
    });
}

/**
 * Validate form before submit
 */
function validateForm() {
const poNumber = $("#po_number").val().trim();
const requestType = $("#request_type").val();
const approvedDate = $("#approved_date").val().trim();
const supplierId = $("#supplier_id").val();
const itemRows = $("#po-items-container tr").not('.text-center.text-gray-500');
const itemsCount = itemRows.length;

    if (!poNumber) {
        return { isValid: false, message: "PO Number harus diisi" };
    }

    if (!requestType) {
        return { isValid: false, message: "Request Type harus dipilih" };
    }

    if (!approvedDate) {
        return { isValid: false, message: "Approved Date harus diisi" };
    }

    if (!supplierId) {
        return { isValid: false, message: "Supplier harus dipilih" };
    }

    if (itemsCount === 0) {
        return { isValid: false, message: "Minimal harus ada 1 item dari PR. Klik 'Ambil Data PR' untuk menambah item." };
    }

    // Validate each item
    let isValid = true;
    let errorMessage = "";

    itemRows.each(function(index) {
        const $r = $(this);
        const rowId = $r.attr('data-row-id');
        const unitPriceInstance = autoNumericInstances[`unit_price_${rowId}`];
        const quantity = parseFloat($r.find('.po-item-quantity').val()) || 0;
        const unitPrice = unitPriceInstance ? unitPriceInstance.getNumber() : 0;
        const slaTarget = $r.find('input[name*="sla_po_to_onsite_target"]').val();

        if (unitPrice <= 0) {
            isValid = false;
            errorMessage = `Item ${index + 1}: Harga satuan harus lebih dari 0`;
            return false;
        }

        if (quantity <= 0) {
            isValid = false;
            errorMessage = `Item ${index + 1}: Quantity harus lebih dari 0`;
            return false;
        }

        if (!slaTarget || slaTarget === '' || parseFloat(slaTarget) <= 0) {
            isValid = false;
            errorMessage = `Item ${index + 1}: SLA Target harus diisi dan lebih dari 0`;
            return false;
        }
    });

    if (!isValid) {
        return { isValid: false, message: errorMessage };
    }

    return { isValid: true };
}

/**
 * Check apakah PO Number sudah pernah diinput (termasuk yang sudah dihapus)
 * Jika sudah ada, tawarkan untuk restore
 */
async function checkDeletedPO(poNumber) {
    try {
        const response = await fetch(route('purchase-order.checkDeletedItem'), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            body: JSON.stringify({ po_number: poNumber })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error checking deleted PO:', data);
            return;
        }

        // Jika ada PO yang sudah dihapus dengan nomor yang sama
        if (data.has_deleted_item && data.deleted_item) {
            const confirmed = await confirmAction(
                `PO Number "${poNumber}" sudah pernah diinput sebelumnya dan telah dihapus. Apakah Anda ingin mengaktifkan kembali data tersebut?`,
                'Data Sudah Pernah Diinput'
            );

            if (confirmed) {
                // User pilih Ya - restore PO
                await restoreDeletedPO(data.deleted_item);
            } else {
                // User pilih Tidak - tampilkan error dan fokus ke input
                $('#po_number').val('').focus();
                $('#error-po_number')
                    .text('PO Number sudah pernah diinput sebelumnya. Silakan gunakan nomor lain atau aktifkan data yang sudah ada.')
                    .removeClass('hidden');
            }
        }
    } catch (error) {
        console.error('Error checking deleted PO:', error);
    }
}

/**
 * Restore PO yang sudah dihapus beserta items-nya
 */
async function restoreDeletedPO(deletedPO) {
    try {
        // Show loading
        const loadingMsg = showWarning('Mengaktifkan kembali data PO...');

        const response = await fetch(route('purchase-order.restore', { 
            purchase_order: deletedPO.id 
        }), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message || 'Gagal mengaktifkan kembali PO');
            return;
        }

        // Populate form dengan data PO yang di-restore
        populateFormFromDeletedPO(deletedPO);
        
        showSuccess('PO berhasil diaktifkan kembali. Data telah dimuat ke form.');
    } catch (error) {
        console.error('Error restoring PO:', error);
        showError('Terjadi kesalahan saat mengaktifkan PO');
    }
}

/**
 * Populate form dengan data dari PO yang di-restore
 */
function populateFormFromDeletedPO(po) {
    // Populate PO information
    $('#po_number').val(po.po_number);
    $('#approved_date').val(po.approved_date);
    
    // Set supplier using NiceSelect
    const supplierSelect = $('#supplier_id')[0];
    if (supplierSelect && po.supplier_id) {
        $(supplierSelect).val(po.supplier_id);
        // Trigger NiceSelect update
        const event = new Event('change', { bubbles: true });
        supplierSelect.dispatchEvent(event);
    }
    
    $('#notes').val(po.notes || '');

    // Remove empty state row if exists
    $('#po-items-container tr.text-center.text-gray-500').remove();

    // Clear existing items
    $('#po-items-container tr').remove();
    
    // Populate items
    if (po.items && Array.isArray(po.items)) {
        po.items.forEach(item => {
            addItemRow({
                id: item.purchase_request_item_id,
                pr_number: item.pr_number,
                item_desc: item.item_desc,
                uom: item.uom,
                unit_price: item.unit_price,
                quantity: item.quantity,
                amount: item.amount,
                pr_amount: item.pr_amount,
                pr_unit_price: item.pr_unit_price,
                pr_quantity: item.pr_quantity,
                sla_po_to_onsite_target: item.sla_po_to_onsite_target,
                sla_pr_to_po_realization: item.sla_pr_to_po_realization,
                approved_date: item.approved_date,
            });
        });
    }

    renumberItems();
    $('#item-select-all').prop('checked', false);
    updateItemDeleteButton();
    
    // Show approved date field untuk restored PO
    $('#approved-date-container').removeClass('hidden');

    // Trigger flatpickr update
    const approvedDateInput = document.querySelector('#approved_date');
    if (approvedDateInput && approvedDateInput._flatpickr && po.approved_date) {
        approvedDateInput._flatpickr.setDate(po.approved_date, true);
    }
}

/**
 * Setup input event listeners to clear errors
 */
function setupErrorClearListeners() {
    $('#po_number').on('input', function() {
        clearFieldError('po_number');
    });

    $('#supplier_id').on('change', function() {
        clearFieldError('supplier_id');
    });
    
    // Check for deleted PO when PO number changes (blur event)
    $('#po_number').on('blur', async function() {
        const poNumber = $(this).val().trim();
        if (!poNumber) return;
        
        await checkDeletedPO(poNumber);
    });
}

// Initialize on document ready
$(document).ready(function() {
    initPOCreate();
    setupErrorClearListeners();
});

export default initPOCreate;
