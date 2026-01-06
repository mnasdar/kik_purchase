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

/**
 * Format number as Indonesian currency without symbol
 */
function formatCurrencyID(value) {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value) || 0;
    return new Intl.NumberFormat('id-ID').format(num);
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
        await loadInvoiceList();
        showInvoiceModal();
    });

    $(document).off('click', '#btn-close-invoice-modal').on('click', '#btn-close-invoice-modal', function() {
        hideInvoiceModal();
    });

    $(document).off('click', '.btn-select-invoice').on('click', '.btn-select-invoice', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $btn = $(this);
        // Prevent double-click
        if ($btn.prop('disabled')) return;
        $btn.prop('disabled', true);
        
        const invoiceId = $btn.data('invoice-id');
        const invoice = invoiceCache.find(inv => inv.id == invoiceId);
        if (invoice) {
            addInvoiceToTable(invoice);
            hideInvoiceModal();
        }
        
        // Re-enable button after a short delay
        setTimeout(() => $btn.prop('disabled', false), 500);
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
    }
}

function renderInvoiceList(list) {
    // Store full list for search functionality
    fullInvoiceList = list;
    
    // Get existing invoice_ids in the table
    const existingInvoiceIds = [];
    $('#pembayaran-items-container .pembayaran-invoice-id').each(function() {
        const rawId = $(this).val();
        const invoiceId = Number(rawId);
        if (!Number.isNaN(invoiceId) && invoiceId > 0) {
            existingInvoiceIds.push(invoiceId);
        }
    });

    // Filter invoices that haven't been added yet
    filteredInvoiceList = list.filter(invoice => !existingInvoiceIds.includes(invoice.id));

    // Reset to first page when loading new list
    currentInvoicePage = 1;
    
    // Update total count
    $('#invoice-total').text(filteredInvoiceList.length);

    if (!filteredInvoiceList.length) {
        $('#invoice-list-body').html(`
            <tr>
                <td colspan="8" class="px-3 py-4 text-center text-gray-500">
                    Tidak ada invoice yang tersedia atau semua sudah ditambahkan
                </td>
            </tr>
        `);
        return;
    }

    // Render first page
    renderInvoicePage(currentInvoicePage);
    setupInvoiceSearch();
    setupInvoicePaginationButtons();
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

    displayedInvoices.forEach(invoice => {
        const row = `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                <td class="px-3 py-2 text-left">
                    <span class="font-medium text-blue-600 dark:text-blue-400">${invoice.invoice_number}</span>
                </td>
                <td class="px-3 py-2 text-left">${invoice.po_number}</td>
                <td class="px-3 py-2 text-left">${invoice.pr_number}</td>
                <td class="px-3 py-2 text-left text-xs">${invoice.item_desc}</td>
                <td class="px-3 py-2 text-right">${formatCurrencyID(invoice.unit_price)}</td>
                <td class="px-3 py-2 text-center">${invoice.quantity ?? '-'}</td>
                <td class="px-3 py-2 text-right font-semibold">${formatCurrencyID(invoice.amount)}</td>
                <td class="px-3 py-2 text-center">
                    <button type="button" class="btn-select-invoice btn btn-sm bg-primary text-white hover:bg-primary-600"
                        data-invoice-id="${invoice.id}">
                        <i class="mgc_check_line me-1"></i>Pilih
                    </button>
                </td>
            </tr>
        `;
        $body.append(row);
    });

    // Update display counters
    $('#invoice-count').text(displayedInvoices.length);
    updateInvoicePaginationControls();
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

function setupInvoiceSearch() {
    $(document).off('input', '#invoice-search-input').on('input', '#invoice-search-input', function() {
        const searchTerm = $(this).val().toLowerCase().trim();
        
        // Get existing invoice_ids in the table
        const existingInvoiceIds = [];
        $('#pembayaran-items-container .pembayaran-invoice-id').each(function() {
            const rawId = $(this).val();
            const invoiceId = Number(rawId);
            if (!Number.isNaN(invoiceId) && invoiceId > 0) {
                existingInvoiceIds.push(invoiceId);
            }
        });

        if (searchTerm === '') {
            // Show all available invoices
            filteredInvoiceList = fullInvoiceList.filter(invoice => !existingInvoiceIds.includes(Number(invoice.id)));
        } else {
            // Filter by search term
            filteredInvoiceList = fullInvoiceList.filter(invoice => {
                if (existingInvoiceIds.includes(Number(invoice.id))) return false;
                
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

/**
 * Add invoice to payment table
 */
function addInvoiceToTable(invoice) {
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
        showError('Invoice ini sudah ditambahkan');
        return;
    }

    addItemRow(invoice);
    
    // Re-render invoice list to update available counts
    renderInvoiceList(invoiceCache);

    renumberItems();
    $('#item-select-all').prop('checked', false);
    updateItemDeleteButton();
    
    showSuccess(`Invoice ${invoice.invoice_number} berhasil ditambahkan`);
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
