/**
 * Modul Pembayaran - Create
 * Mengelola form create pembayaran dengan dynamic items dari invoice
 */
import $ from "jquery";
import flatpickr from "flatpickr";
import { showSuccess, showError, confirmAction } from '../../../core/notification';

let itemCounter = 0;
let invoiceCache = [];
let flatpickrInstances = [];
let defaultPaymentDateInstance = null;
let isSubmitting = false; // Flag to prevent double submit
let selectedInvoiceIds = new Set();

/**
 * Format number as Indonesian currency without symbol
 */
function formatCurrencyID(value) {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value) || 0;
    return new Intl.NumberFormat('id-ID').format(num);
}

function syncSelectedInvoiceIdsFromTable() {
    selectedInvoiceIds.clear();
    $('#pembayaran-items-container .pembayaran-invoice-id').each(function() {
        const val = Number($(this).val());
        if (!Number.isNaN(val) && val > 0) {
            selectedInvoiceIds.add(val);
        }
    });
}

/**
 * Calculate working days between two dates (excluding weekends)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Number of working days
 */
function calculateWorkingDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set to start of day to avoid time issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    if (end < start) return 0;
    
    let workingDays = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
}

export function initPembayaranCreate() {
    if (!$("#form-create-pembayaran").length) return;

    setupDynamicItems();
    setupInvoicePicker();
    setupPaymentDate();
    syncSelectedInvoiceIdsFromTable();
}

/**
 * Setup dynamic items (add/remove rows)
 */
function setupDynamicItems() {
    // Remove item button (delegated)
    $(document).on("click", ".pembayaran-btn-remove-item", function() {
        const $row = $(this).closest("tr");
        const invoiceId = $row.find('.pembayaran-invoice-id').val();
        
        // Destroy flatpickr instance for this row
        const rowId = $row.attr('data-row-id');
        const flatpickrIndex = flatpickrInstances.findIndex(fp => fp.rowId === rowId);
        if (flatpickrIndex !== -1) {
            if (flatpickrInstances[flatpickrIndex].instance) {
                flatpickrInstances[flatpickrIndex].instance.destroy();
            }
            flatpickrInstances.splice(flatpickrIndex, 1);
        }
        
        $row.remove();
        renumberItems();
        checkAndShowEmptyState();
        syncSelectedInvoiceIdsFromTable();
        
        // Re-render invoice list to show newly available invoice
        if (invoiceCache.length > 0) {
            renderInvoiceList(invoiceCache);
        }
    });

    // Item checkboxes
    setupItemCheckboxes();
    
    // Delete selected items button
    $(document).on('click', '#btn-delete-selected-items', function() {
        deleteSelectedItems();
    });
    
    // Setup form submit
    setupFormSubmit();
}

/**
 * Setup item checkboxes for bulk selection
 */
function setupItemCheckboxes() {
    // Select all checkbox
    $(document).off('change', '#item-select-all').on('change', '#item-select-all', function() {
        $('.item-checkbox').prop('checked', this.checked);
        updateItemDeleteButton();
    });

    // Individual checkboxes
    $(document).off('change', '.item-checkbox').on('change', '.item-checkbox', function() {
        const allChecked = $('.item-checkbox').length === $('.item-checkbox:checked').length;
        $('#item-select-all').prop('checked', allChecked);
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
        showError('Tidak ada item yang dipilih');
        return;
    }

    const confirmed = await confirmAction(
        `Apakah Anda yakin ingin menghapus ${selectedCount} item terpilih?`,
        'Konfirmasi Hapus'
    );

    if (!confirmed) return;

    // Destroy flatpickr instances for selected rows
    selectedRows.each(function() {
        const rowId = $(this).attr('data-row-id');
        const flatpickrIndex = flatpickrInstances.findIndex(fp => fp.rowId === rowId);
        if (flatpickrIndex !== -1) {
            if (flatpickrInstances[flatpickrIndex].instance) {
                flatpickrInstances[flatpickrIndex].instance.destroy();
            }
            flatpickrInstances.splice(flatpickrIndex, 1);
        }
    });

    // Remove selected rows
    selectedRows.remove();
    
    renumberItems();
    syncSelectedInvoiceIdsFromTable();
    
    // Reset checkboxes
    $('#item-select-all').prop('checked', false);
    updateItemDeleteButton();
    
    // Show empty state if no items left
    checkAndShowEmptyState();
    
    // Re-render invoice list to show newly available invoices
    if (invoiceCache.length > 0) {
        renderInvoiceList(invoiceCache);
    }
    
    showSuccess(`${selectedCount} item berhasil dihapus`);
}

/**
 * Setup invoice picker modal and load invoice list
 */
function setupInvoicePicker() {
    $(document).off('click', '#btn-pick-invoice').on('click', '#btn-pick-invoice', async function() {
        syncSelectedInvoiceIdsFromTable();
        showInvoiceLoadingOverlay();
        await loadInvoiceList();
        refreshInvoiceCheckboxVisual();
        updateSelectedCountDisplay();
    });

    $(document).off('click', '#btn-close-invoice-modal').on('click', '#btn-close-invoice-modal', function() {
        hideInvoiceModal();
    });

    $(document).off('click', '#btn-close-invoice-modal-footer').on('click', '#btn-close-invoice-modal-footer', function() {
        hideInvoiceModal();
    });

    $(document).off('change', '.invoice-row-checkbox').on('change', '.invoice-row-checkbox', function() {
        const invoiceId = Number($(this).data('invoice-id'));
        if (this.checked) {
            selectedInvoiceIds.add(invoiceId);
        } else {
            selectedInvoiceIds.delete(invoiceId);
        }
        refreshInvoiceSelectAllState();
        updateSelectedCountDisplay();
    });

    $(document).off('change', '#invoice-select-all').on('change', '#invoice-select-all', function() {
        const visibleCheckboxes = $('.invoice-row-checkbox');
        const shouldCheck = $(this).is(':checked');
        visibleCheckboxes.each(function() {
            const invoiceId = Number($(this).data('invoice-id'));
            if (shouldCheck) {
                selectedInvoiceIds.add(invoiceId);
            } else {
                selectedInvoiceIds.delete(invoiceId);
            }
            $(this).prop('checked', shouldCheck);
        });
        updateSelectedCountDisplay();
    });

    $(document).off('click', '#btn-apply-selected-invoices').on('click', '#btn-apply-selected-invoices', function() {
        applySelectedInvoices();
    });
}

// Store the full invoice list and pagination state for searching
let fullInvoiceList = [];
let currentInvoicePage = 1;
let invoicePageSize = 10;
let filteredInvoiceList = [];

/**
 * Load invoice list
 */
async function loadInvoiceList() {
    try {
        const response = await fetch('/invoice/pembayaran/get-invoices', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Gagal memuat data invoice');
        
        const data = await response.json();
        invoiceCache = data;
        renderInvoiceList(data);
    } catch (error) {
        console.error('Error loading invoices:', error);
        showError('Gagal memuat data invoice');
        hideInvoiceLoadingOverlay();
    }
}

function updateSelectedCountDisplay() {
    // Count only non-existing invoices in selection
    const existingIds = new Set();
    $('#pembayaran-items-container .pembayaran-invoice-id').each(function() {
        const val = Number($(this).val());
        if (!Number.isNaN(val) && val > 0) {
            existingIds.add(val);
        }
    });
    
    const newCount = Array.from(selectedInvoiceIds).filter(id => !existingIds.has(id)).length;
    $('#invoice-selected-count').text(newCount);
    $('#btn-apply-count').text(newCount);
    $('#btn-apply-selected-invoices').prop('disabled', newCount === 0);
}

function applySelectedInvoices() {
    const existingIds = new Set();
    $('#pembayaran-items-container .pembayaran-invoice-id').each(function() {
        const val = Number($(this).val());
        if (!Number.isNaN(val) && val > 0) {
            existingIds.add(val);
        }
    });

    const toAdd = [];
    selectedInvoiceIds.forEach(invoiceId => {
        if (!existingIds.has(invoiceId)) {
            const invoice = invoiceCache.find(inv => Number(inv.id) === invoiceId);
            if (invoice) {
                toAdd.push(invoice);
            }
        }
    });

    if (toAdd.length === 0) {
        showError('Pilih minimal 1 invoice baru');
        return;
    }

    // Add only new invoices to table
    toAdd.forEach(invoice => {
        addInvoiceToTable(invoice);
    });

    // Sync and refresh modal display
    syncSelectedInvoiceIdsFromTable();
    renderInvoiceList(invoiceCache);
    updateSelectedCountDisplay();
    hideInvoiceModal();
}

function renderInvoiceList(list) {
    // Get existing invoice ids from table
    const existingIds = new Set();
    $('#pembayaran-items-container .pembayaran-invoice-id').each(function() {
        const val = Number($(this).val());
        if (!Number.isNaN(val) && val > 0) {
            existingIds.add(val);
        }
    });

    // Show all invoices, mark existing ones in selection
    fullInvoiceList = list;
    filteredInvoiceList = [...fullInvoiceList];
    
    // Ensure existing invoices are marked in selectedInvoiceIds
    existingIds.forEach(id => selectedInvoiceIds.add(id));
    
    // Reset to first page when loading new list
    currentInvoicePage = 1;
    
    // Update total count
    $('#invoice-total').text(filteredInvoiceList.length);

    if (!filteredInvoiceList.length) {
        $('#invoice-list-body').html(`
            <tr>
                <td colspan="8" class="px-3 py-4 text-center text-gray-500">
                    Tidak ada invoice yang tersedia
                </td>
            </tr>
        `);
        return;
    }

    // Render first page
    renderInvoicePage(currentInvoicePage);
    setupInvoiceSearch();
    setupInvoicePaginationButtons();
    hideInvoiceLoadingOverlay();
    showInvoiceModal();
}

function renderInvoicePage(pageNum) {
    const startIdx = (pageNum - 1) * invoicePageSize;
    const endIdx = startIdx + invoicePageSize;
    const displayedInvoices = filteredInvoiceList.slice(startIdx, endIdx);

    const $body = $('#invoice-list-body');
    $body.empty();

    if (!displayedInvoices.length) {
        $body.html(`
            <tr>
                <td colspan="8" class="px-3 py-4 text-center text-gray-500">
                    Tidak ada invoice yang cocok dengan pencarian
                </td>
            </tr>
        `);
        return;
    }

    // Get existing ids for this page render
    const existingIds = new Set();
    $('#pembayaran-items-container .pembayaran-invoice-id').each(function() {
        const val = Number($(this).val());
        if (!Number.isNaN(val) && val > 0) {
            existingIds.add(val);
        }
    });

    displayedInvoices.forEach(invoice => {
        const isChecked = selectedInvoiceIds.has(Number(invoice.id));
        const isExisting = existingIds.has(Number(invoice.id));
        const disabledAttr = isExisting ? 'disabled' : '';
        const rowClass = isExisting ? 'bg-gray-100 dark:bg-slate-700/50 opacity-60' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30';
        
        const row = `
            <tr class="${rowClass}">
                <td class="px-3 py-2 text-center">
                    <input type="checkbox" class="form-checkbox rounded text-primary invoice-row-checkbox" data-invoice-id="${invoice.id}" ${isChecked ? 'checked' : ''} ${disabledAttr} title="${isExisting ? 'Sudah ditambahkan' : ''}">
                </td>
                <td class="px-3 py-2 text-left">
                    <span class="font-medium text-blue-600 dark:text-blue-400">${invoice.invoice_number}</span>
                </td>
                <td class="px-3 py-2 text-left">${invoice.po_number}</td>
                <td class="px-3 py-2 text-left">${invoice.pr_number}</td>
                <td class="px-3 py-2 text-left text-xs">${invoice.item_desc}</td>
                <td class="px-3 py-2 text-right">${formatCurrencyID(invoice.unit_price)}</td>
                <td class="px-3 py-2 text-center">${invoice.quantity ?? '-'}</td>
                <td class="px-3 py-2 text-right font-semibold">${formatCurrencyID(invoice.amount)}</td>
            </tr>
        `;
        $body.append(row);
    });

    // Re-attach checkbox handlers
    attachInvoiceCheckboxHandlers();

    // Update display counters
    $('#invoice-count').text(displayedInvoices.length);
    updateInvoicePaginationControls();
    refreshInvoiceSelectAllState();
}

function updateInvoicePaginationControls() {
    const totalPages = Math.ceil(filteredInvoiceList.length / invoicePageSize) || 1;
    
    $('#invoice-current-page').text(currentInvoicePage);
    $('#invoice-total-pages').text(totalPages);
    $('#invoice-per-page').text(invoicePageSize);
    
    // Enable/disable buttons
    $('#btn-invoice-prev').prop('disabled', currentInvoicePage <= 1);
    $('#btn-invoice-next').prop('disabled', currentInvoicePage >= totalPages);
}

function attachInvoiceCheckboxHandlers() {
    $(document).off('change', '.invoice-row-checkbox').on('change', '.invoice-row-checkbox', function(e) {
        // Don't allow unchecking disabled (existing) invoices
        if ($(this).is(':disabled')) {
            e.preventDefault();
            return false;
        }

        const invoiceId = Number($(this).data('invoice-id'));
        if (this.checked) {
            selectedInvoiceIds.add(invoiceId);
        } else {
            selectedInvoiceIds.delete(invoiceId);
        }
        refreshInvoiceSelectAllState();
        updateSelectedCountDisplay();
    });
}


function refreshInvoiceSelectAllState() {
    const checkboxes = $('.invoice-row-checkbox');
    if (!checkboxes.length) {
        $('#invoice-select-all').prop('checked', false);
        return;
    }
    const checked = $('.invoice-row-checkbox:checked').length;
    $('#invoice-select-all').prop('checked', checked > 0 && checked === checkboxes.length);
}

function refreshInvoiceCheckboxVisual() {
    $('.invoice-row-checkbox').each(function() {
        const id = Number($(this).data('invoice-id'));
        $(this).prop('checked', selectedInvoiceIds.has(id));
    });
    refreshInvoiceSelectAllState();
}

function setupInvoiceSearch() {
    $(document).off('input', '#invoice-search-input').on('input', '#invoice-search-input', function() {
        const searchTerm = $(this).val().toLowerCase().trim();

        if (searchTerm === '') {
            filteredInvoiceList = [...fullInvoiceList];
        } else {
            filteredInvoiceList = fullInvoiceList.filter(invoice => {
                return (
                    (invoice.invoice_number || '').toLowerCase().includes(searchTerm) ||
                    (invoice.po_number || '').toLowerCase().includes(searchTerm) ||
                    (invoice.pr_number || '').toLowerCase().includes(searchTerm) ||
                    (invoice.item_desc || '').toLowerCase().includes(searchTerm)
                );
            });
        }

        // Reset to first page
        currentInvoicePage = 1;
        $('#invoice-total').text(filteredInvoiceList.length);
        renderInvoicePage(currentInvoicePage);
    });
}

// Setup pagination button listeners
function setupInvoicePaginationButtons() {
    $(document).off('click', '#btn-invoice-prev').on('click', '#btn-invoice-prev', function() {
        if (currentInvoicePage > 1) {
            currentInvoicePage--;
            renderInvoicePage(currentInvoicePage);
        }
    });

    $(document).off('click', '#btn-invoice-next').on('click', '#btn-invoice-next', function() {
        const totalPages = Math.ceil(filteredInvoiceList.length / invoicePageSize);
        if (currentInvoicePage < totalPages) {
            currentInvoicePage++;
            renderInvoicePage(currentInvoicePage);
        }
    });
}

function showInvoiceModal() {
    $('#modal-pick-invoice').removeClass('hidden');
}

function hideInvoiceModal() {
    $('#modal-pick-invoice').addClass('hidden');
}

function showInvoiceLoadingOverlay() {
    $('#invoice-page-loading').removeClass('hidden');
}

function hideInvoiceLoadingOverlay() {
    $('#invoice-page-loading').addClass('hidden');
}

/**
 * Add invoice to payment table
 */
function addInvoiceToTable(invoice, options = {}) {
    // Remove empty state row if exists
    $('#pembayaran-items-container tr.text-center.text-gray-500').remove();

    // Check if invoice already exists - only check actual data rows
    const existingInvoiceIds = [];
    $('#pembayaran-items-container tr.pembayaran-item-row .pembayaran-invoice-id').each(function() {
        const rawId = $(this).val();
        const invoiceId = Number(rawId);
        if (!Number.isNaN(invoiceId) && invoiceId > 0) {
            existingInvoiceIds.push(invoiceId);
        }
    });

    if (existingInvoiceIds.includes(Number(invoice.id))) {
        return;
    }

    addItemRow(invoice);
    selectedInvoiceIds.add(Number(invoice.id));

    renumberItems();
    $('#item-select-all').prop('checked', false);
    updateItemDeleteButton();
}

function removeInvoiceFromTable(invoiceId) {
    $('#pembayaran-items-container tr.pembayaran-item-row').each(function() {
        const currentId = Number($(this).find('.pembayaran-invoice-id').val());
        if (currentId === invoiceId) {
            const rowId = $(this).attr('data-row-id');
            const fpIndex = flatpickrInstances.findIndex(fp => fp.rowId === rowId);
            if (fpIndex !== -1) {
                if (flatpickrInstances[fpIndex].instance) {
                    flatpickrInstances[fpIndex].instance.destroy();
                }
                flatpickrInstances.splice(fpIndex, 1);
            }
            $(this).remove();
        }
    });
    renumberItems();
    checkAndShowEmptyState();
    syncSelectedInvoiceIdsFromTable();
    refreshInvoiceCheckboxVisual();
}

/**
 * Add new item row
 */
function addItemRow(invoice) {
    const template = $("#pembayaran-item-row-template").html();
    const $row = $(template);
    
    // Update row index
    const newIndex = itemCounter++;
    const rowId = 'row-' + newIndex;
    $row.attr('data-row-id', rowId);
    $row.find("input, select").each(function() {
        const name = $(this).attr("name");
        if (name) {
            $(this).attr("name", name.replace('[0]', `[${newIndex}]`));
        }
    });

    $("#pembayaran-items-container").append($row);
    
    // Populate invoice data
    $row.find('.pembayaran-invoice-id').val(invoice.id);
    $row.find('.pembayaran-invoice-number').text(invoice.invoice_number);
    $row.find('.pembayaran-po-number').text(invoice.po_number);
    $row.find('.pembayaran-pr-number').text(invoice.pr_number);
    $row.find('.pembayaran-item-desc').text(invoice.item_desc);
    $row.find('.pembayaran-unit-price').text(formatCurrencyID(invoice.unit_price));
    $row.find('.pembayaran-qty').text(invoice.quantity);
    $row.find('.pembayaran-amount').text(formatCurrencyID(invoice.amount));
    
    // Set invoice submitted date
    if (invoice.submitted_at) {
        $row.find('.pembayaran-submitted-at').val(invoice.submitted_at);
        $row.find('.pembayaran-submitted-date').text(formatDate(invoice.submitted_at));
    }
    
    // Calculate SLA if payment date is already set
    const paymentDate = $('#payment_date').val();
    if (paymentDate && invoice.submitted_at) {
        const workingDays = calculateWorkingDays(invoice.submitted_at, paymentDate);
        $row.find('.pembayaran-sla-display').text(workingDays + ' hari');
        $row.find('.pembayaran-sla-input').val(workingDays);
    }
}

/**
 * Format date to d-M-y format
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().substr(-2);
    return `${day}-${month}-${year}`;
}

/**
 * Renumber items after add/remove
 */
function renumberItems() {
    $('#pembayaran-items-container tr.pembayaran-item-row').each(function(index) {
        // Update visible number
        $(this).find('.pembayaran-item-number').text(index + 1);

        // Normalize name indexes to keep items[] contiguous
        $(this).find('input, select, textarea').each(function() {
            const name = $(this).attr('name');
            if (!name) return;
            const updated = name.replace(/items\[\d+\]/, `items[${index}]`);
            $(this).attr('name', updated);
        });
    });
}

/**
 * Check and show empty state if no items
 */
function checkAndShowEmptyState() {
    const itemRows = $('#pembayaran-items-container tr').not('.text-center.text-gray-500');
    if (itemRows.length === 0) {
        const emptyRow = `
            <tr class="text-center text-gray-500">
                <td colspan="12" class="border px-4 py-8">
                    <div class="flex flex-col items-center gap-2">
                        <i class="mgc_inbox_line text-4xl text-gray-400"></i>
                        <p class="text-sm">Belum ada invoice yang dipilih</p>
                        <p class="text-xs text-gray-400">Klik tombol "Pilih Invoice" untuk memulai</p>
                    </div>
                </td>
            </tr>
        `;
        $('#pembayaran-items-container').html(emptyRow);
    }
}

/**
 * Setup payment date flatpickr and auto-calculate SLA
 */
function setupPaymentDate() {
    const paymentDateInput = document.getElementById('payment_date');
    if (paymentDateInput) {
        const fpInstance = flatpickr(paymentDateInput, {
            altInput: true,
            altFormat: "d-M-y",
            dateFormat: "Y-m-d",
            allowInput: true,
            locale: {
                firstDayOfWeek: 1
            },
            onChange: function(selectedDates, dateStr) {
                // Recalculate SLA for all items when payment date changes
                calculateAllSLA();
            }
        });
    }
}

/**
 * Calculate SLA for all items based on payment date and invoice submit date
 */
function calculateAllSLA() {
    const paymentDate = $('#payment_date').val();
    
    if (!paymentDate) {
        // Clear all SLA if no payment date
        $('.pembayaran-sla-display').text('-');
        $('.pembayaran-sla-input').val('');
        return;
    }
    
    $('#pembayaran-items-container tr.pembayaran-item-row').each(function() {
        const $row = $(this);
        const submittedAt = $row.find('.pembayaran-submitted-at').val();
        
        if (submittedAt) {
            const workingDays = calculateWorkingDays(submittedAt, paymentDate);
            $row.find('.pembayaran-sla-display').text(workingDays + ' hari');
            $row.find('.pembayaran-sla-input').val(workingDays);
        } else {
            $row.find('.pembayaran-sla-display').text('-');
            $row.find('.pembayaran-sla-input').val('');
        }
    });
}

/**
 * Setup form submit
 */
function setupFormSubmit() {
    // Remove existing handler to prevent double binding
    $('#form-create-pembayaran').off('submit').on('submit', async function(e) {
        e.preventDefault();
        
        // Prevent double submit
        if (isSubmitting) {
            console.log('Form is already being submitted...');
            return false;
        }
        
        // Validate form
        if (!validateForm()) {
            return false;
        }
        
        // Set submitting flag
        isSubmitting = true;
        
        const formData = new FormData(this);
        
        // Add payment_number and payment_date to each item using existing indexes in field names
        const paymentNumber = $('#payment_number').val();
        const paymentDate = $('#payment_date').val();
        
        $('#pembayaran-items-container tr.pembayaran-item-row').each(function() {
            const invoiceInput = $(this).find('.pembayaran-invoice-id');
            const name = invoiceInput.attr('name') || '';
            const match = name.match(/items\[(\d+)\]/);
            const idx = match ? match[1] : null;
            if (idx === null) return;

            if (paymentNumber) {
                formData.set(`items[${idx}][payment_number]`, paymentNumber);
            }
            formData.set(`items[${idx}][payment_date]`, paymentDate);
        });
        
        const $submitBtn = $(this).find('button[type="submit"]');
        const originalText = $submitBtn.html();
        
        // Disable button immediately
        $submitBtn.prop('disabled', true).html('<i class="mgc_loading_line animate-spin me-2"></i>Menyimpan...');
        
        try {
            const response = await fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Gagal menyimpan pembayaran');
            }
            
            showSuccess(data.message || 'Pembayaran berhasil disimpan');
            
            // Redirect after 1 second
            setTimeout(() => {
                window.location.href = '/invoice/pembayaran';
            }, 1000);
            
        } catch (error) {
            showError(error.message);
            
            // Re-enable button on error
            $submitBtn.prop('disabled', false).html(originalText);
            isSubmitting = false;
        }
    });
}

/**
 * Validate form before submit
 */
function validateForm() {
    const itemRows = $('#pembayaran-items-container tr.pembayaran-item-row');
    
    if (itemRows.length === 0) {
        showError('Belum ada invoice yang dipilih. Silakan pilih minimal 1 invoice.');
        return false;
    }
    
    const paymentDate = $('#payment_date').val();
    if (!paymentDate || paymentDate.trim() === '') {
        showError('Payment Date wajib diisi');
        $('#payment_date').focus();
        return false;
    }
    
    return true;
}

// Initialize on document ready
$(document).ready(function() {
    initPembayaranCreate();
});

export default initPembayaranCreate;
