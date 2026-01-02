/**
 * Modul Purchase Order - Update
 * Mengelola form update purchase order dengan dynamic items
 * 
 * Fitur utama:
 * - Edit data PO yang sudah ada (nomor, tanggal, supplier, catatan)
 * - Manage items dengan operasi ADD/EDIT/DELETE
 * - Kalkulasi otomatis amount (quantity × unit_price)
 * - Validasi SLA Target dan SLA Realisasi
 * - Integrasi PR untuk referensi harga dan data items
 * - Dukungan format currency Indonesia (titik pemisah ribuan, koma desimal)
 */

import flatpickr from 'flatpickr';
import AutoNumeric from 'autonumeric';
import { showSuccess, showError, showWarning,confirmAction } from '../../../core/notification';
import { route } from 'ziggy-js';
import $ from "jquery";
import NiceSelect from "nice-select2/src/js/nice-select2.js";

// Counter untuk item baru (mulai dari -1 untuk membedakan dengan existing items dari DB)
let itemCounter = -1;
// Menyimpan instance AutoNumeric untuk formatting currency di setiap row item
let autoNumericInstances = {};
// Cache data PR list untuk pencarian dan filtering
let prCache = [];
// ID PO yang sedang diedit (dari data attribute form)
const poId = $('[data-po-id]').data('po-id');

// Track form state untuk deteksi perubahan
let initialFormState = {};
let currentFormState = {};
let hasChanges = false;

/**
 * Normalisasi input tanggal (string atau Date) menjadi Date pada pukul 00:00:00.
 * Mendukung string "YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", dan ISO string.
 * Mengembalikan null jika parsing gagal.
 */
function normalizeToDateOnly(dateInput) {
    if (!dateInput) return null;

    if (dateInput instanceof Date && !Number.isNaN(dateInput)) {
        return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }

    if (typeof dateInput === 'string') {
        const trimmed = dateInput.trim();
        if (!trimmed) return null;

        // Ambil hanya bagian tanggal jika ada waktu ("YYYY-MM-DD HH:mm:ss" atau "YYYY-MM-DDTHH:mm:ss")
        const datePart = trimmed.split(' ')[0].split('T')[0];
        const [y, m, d] = datePart.split('-').map(n => parseInt(n, 10));

        if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
            const parsed = new Date(y, m - 1, d);
            if (!Number.isNaN(parsed)) return parsed;
        }

        const fallback = new Date(trimmed);
        if (!Number.isNaN(fallback)) {
            return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
        }
    }

    return null;
}

/**
 * Hitung jumlah hari kerja (Senin-Jumat) antara dua tanggal
 * Berguna untuk perhitungan SLA (Service Level Agreement)
 * 
 * @param {Date|string} startDate - Tanggal mulai (format Y-m-d atau Date object)
 * @param {Date|string} endDate - Tanggal akhir (format Y-m-d atau Date object), default hari ini
 * @returns {number} Jumlah hari kerja
 */
function calculateWorkingDays(startDate, endDate = null) {
    const start = normalizeToDateOnly(startDate);
    const end = normalizeToDateOnly(endDate || new Date());

    if (!start || !end) return 0;
    if (start > end) return 0;

    let workingDays = 0;
    let currentDate = new Date(start);

    // Iterasi setiap hari dari tanggal mulai hingga akhir
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay(); // 0 = Minggu, 6 = Sabtu
        // Hitung hanya Senin (1) sampai Jumat (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
}

/**
 * Tampilkan peringatan jika ada item dengan SLA Realisasi < 1 hari.
 * Menunjukkan kasus ketika tanggal PR lebih besar daripada tanggal PO.
 */
function warnIfLowSLA() {
    const rows = $('#po-items-container tr').not('.text-center.text-gray-500');
    let lowCount = 0;

    rows.each(function() {
        const sla = parseFloat($(this).find('input[name*="sla_pr_to_po_realization"]').val());
        if (!Number.isNaN(sla) && sla < 1) {
            lowCount++;
        }
    });

    if (lowCount > 0) {
        showWarning(`Terdapat ${lowCount} item dengan SLA Realisasi < 1 (tanggal PR lebih besar dari tanggal PO).`);
    }
}

/**
 * Cek apakah tanggal PR lebih besar dari tanggal PO (setelah dinormalisasi).
 */
function isPrAfterPo(prApprovedDate, poApprovedDate) {
    const prDate = normalizeToDateOnly(prApprovedDate);
    const poDate = normalizeToDateOnly(poApprovedDate);

    if (!prDate || !poDate) return false;
    return prDate > poDate;
}

/**
 * Ambil tanggal approved PR dengan fallback beberapa properti umum.
 */
function resolvePrApprovedDate(pr) {
    if (!pr) return null;
    return pr.approved_date_raw
        || pr.approved_date
        || pr.approvedDate
        || pr.approved_at
        || (Array.isArray(pr.items) && pr.items.length ? pr.items[0].approved_date : null);
}

/**
 * Format number sebagai currency Indonesia tanpa simbol
 * Format: 1000 -> "1.000", 1500000 -> "1.500.000"
 * 
 * @param {number} value - Nilai yang akan diformat
 * @returns {string} String currency terformat atau '-' jika nilai kosong
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
    // Inisialisasi NiceSelect untuk dropdown supplier dengan fitur search
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
    if (document.querySelector('style[data-po-update]')) return;
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
    styleElement.setAttribute('data-po-update', 'true');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

/**
 * Inisialisasi form update PO
 * Fungsi entry point yang mengatur semua event listener dan setup awal
 */
export function initPOUpdate() {
    // Cek apakah form edit PO ada di halaman
    if (!$("#form-create-po").length) return;

    injectCustomStyles();
    setupFlatpickr();
    setupFormSubmit();
    setupDynamicItems();
    setupPrPicker();
    
    // Rebuild AutoNumeric untuk existing items dari database
    rebuildAutoNumericInstances();
    
    // Capture initial form state dan setup change detection
    captureInitialFormState();
    setupChangeDetection();
}

/**
 * Setup Flatpickr date picker untuk field approved_date
 * Format tampilan: dd-MMM-yy (contoh: 25-Dec-24)
 * Format simpan: YYYY-MM-DD
 */
function setupFlatpickr() {
    flatpickr("#approved_date", {
        altInput: true,
        altFormat: "d-M-y",
        dateFormat: "Y-m-d",
        allowInput: true,
        locale: {
            firstDayOfWeek: 1 // Mulai dari Senin
        },
        onChange: function(selectedDates, dateStr, instance) {
            // Recalculate SLA Realisasi untuk semua items saat tanggal PO berubah
            recalculateSLARealisasi(dateStr);
        }
    });
}

/**
 * Kalkulasi ulang SLA Realisasi untuk semua items saat tanggal PO berubah
 * SLA Realisasi = hari kerja dari tanggal PR approved ke tanggal PO approved
 * Berguna untuk tracking kepatuhan SLA penerimaan barang
 * 
 * @param {string} poApprovedDate - Tanggal PO disetujui (format Y-m-d)
 */
function recalculateSLARealisasi(poApprovedDate) {
    // Jika tanggal PO kosong, jangan ubah SLA Realisasi (biarkan tetap seperti sebelumnya)
    if (!poApprovedDate || poApprovedDate.trim() === '') {
        return;
    }

    // Kalkulasi ulang untuk setiap row item yang memiliki PR Approved Date
    $('#po-items-container .po-item-row').each(function() {
        const $row = $(this);
        const prApprovedDate = $row.find('.po-pr-approved-date').attr('data-pr-approved-date');

        // Hanya kalkulasi jika item memiliki data PR approved date
        if (prApprovedDate && prApprovedDate.trim() !== '') {
            const slaRealization = calculateWorkingDays(prApprovedDate, poApprovedDate);
            $row.find('input[name*="sla_pr_to_po_realization"]').val(slaRealization);
        }
        // Jika tidak ada PR approved date, jangan ubah nilai SLA Realisasi yang sudah ada
    });

    // Setelah kalkulasi ulang, beri peringatan jika ada SLA < 1
    warnIfLowSLA();
}

/**
 * Setup dynamic items (add/remove rows)
 * Mengelola event listeners untuk:
 * - Penghapusan item individual
 * - Perhitungan otomatis amount saat quantity berubah
 * - Bulk selection dan deletion items
 */
function setupDynamicItems() {
    // Event listener penghapusan item individual (delegated event)
    $(document).on("click", ".po-btn-remove-item", function() {
        const row = $(this).closest("tr");
        
        // Hapus row dan rebuild instance AutoNumeric
        row.remove();
        rebuildAutoNumericInstances();
        renumberItems();
        
        // Tampilkan empty state jika tidak ada items
        checkAndShowEmptyState();
        
        // Re-render PR list untuk update available items count
        if (prCache.length > 0) {
            renderPrList(prCache);
        }
    });

    // Event listener perubahan quantity - hitung ulang amount (qty × unit_price)
    $(document).on("input", ".po-item-quantity", function() {
        const $row = $(this).closest("tr");
        calculateRowAmount($row);
    });

    // Setup checkbox event listeners
    setupItemCheckboxes();
    
    // Event listener tombol delete selected items
    $(document).on('click', '#btn-delete-selected-items', function() {
        deleteSelectedItems();
    });
}

/**
 * Setup checkbox untuk bulk selection item
 * Fitur:
 * - Select All checkbox untuk select/deselect semua items
 * - Individual checkbox untuk select item tertentu
 * - Update visibility tombol delete berdasarkan selection
 */
function setupItemCheckboxes() {
    // Select All checkbox - toggle semua item checkbox
    $(document).off('change', '#item-select-all').on('change', '#item-select-all', function() {
        const isChecked = $(this).prop('checked');
        $('.item-checkbox').prop('checked', isChecked);
        updateItemDeleteButton();
    });

    // Individual checkbox - update state select-all berdasarkan selection
    $(document).off('change', '.item-checkbox').on('change', '.item-checkbox', function() {
        const totalCheckboxes = $('.item-checkbox').length;
        const checkedCheckboxes = $('.item-checkbox:checked').length;
        // Check select-all hanya jika semua item terseleksi
        $('#item-select-all').prop('checked', totalCheckboxes === checkedCheckboxes);
        updateItemDeleteButton();
    });
}

/**
 * Update visibility tombol delete selected items
 * Tampilkan jika ada items terseleksi, sembunyikan jika tidak ada
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
 * Hapus items yang terseleksi dengan konfirmasi
 * Setelah penghapusan:
 * - Rebuild AutoNumeric instances
 * - Renumber ulang items
 * - Reset checkboxes
 * - Update PR list untuk show available items
 */
async function deleteSelectedItems() {
    const selectedRows = $('.item-checkbox:checked').closest('tr');
    const selectedCount = selectedRows.length;
    
    if (selectedCount === 0) {
        showWarning('Pilih minimal 1 item untuk dihapus');
        return;
    }

    // Konfirmasi penghapusan
    const confirmed = await confirmAction(
        `Apakah Anda yakin ingin menghapus ${selectedCount} item terpilih?`,
        'Konfirmasi Hapus'
    );

    if (!confirmed) return;

    // Hapus row yang terseleksi
    selectedRows.remove();
    
    // Rebuild dan reset
    rebuildAutoNumericInstances();
    renumberItems();
    
    // Reset checkbox state
    $('#item-select-all').prop('checked', false);
    updateItemDeleteButton();
    
    // Tampilkan empty state jika tidak ada items
    checkAndShowEmptyState();
    
    // Re-render PR list untuk update available items
    if (prCache.length > 0) {
        renderPrList(prCache);
    }
    
    showSuccess(`${selectedCount} item berhasil dihapus`);
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
 * Load PR list with items for current prefix
 */
async function loadPrList() {
    try {
        const response = await fetch(route('purchase-order.pr-list'), {
            headers: { Accept: 'application/json' }
        });
        const data = await response.json();
        if (!response.ok) {
            showError(data.message || 'Gagal memuat PR');
            return;
        }
        prCache = data.data || [];
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
        $body.append('<tr><td colspan="5" class="px-3 py-3 text-center text-gray-500">Tidak ada PR yang sesuai</td></tr>');
        return;
    }

    displayedPrs.forEach(pr => {
        const availableCount = pr.available_items_count || 0;
        const locationName = pr.location_name || '-';
        const formattedDate = pr.formatted_approved_date || '-';
        
        $body.append(`
            <tr class="border-b last:border-0 pr-row" data-pr-number="${pr.pr_number}" data-location="${locationName}">
                <td class="px-3 py-2 font-semibold text-gray-800 dark:text-gray-100">${pr.pr_number}</td>
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
        return;
    }

    // Beri peringatan jika tanggal approved PR lebih besar daripada tanggal approved PO
    const poApprovedDate = $("#approved_date").val().trim();
    const prApprovedDate = resolvePrApprovedDate(pr);
    const prAfterPo = poApprovedDate && prApprovedDate && isPrAfterPo(prApprovedDate, poApprovedDate);
    if (prAfterPo) {
        showWarning(
            `Tanggal Approved PR (${formatDateID(prApprovedDate)}) lebih besar dari tanggal Approved PO (${formatDateID(poApprovedDate)}).`
        );
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

    // Warning jika SLA item < 1
    warnIfLowSLA();

    if (prAfterPo) {
        showWarning(`${addedCount} item dari PR ${pr.pr_number} ditambahkan, namun tanggal approved PR lebih besar dari PO.`);
    } else {
        showSuccess(`${addedCount} item dari PR ${pr.pr_number} berhasil ditambahkan`);
    }
}

/**
 * Tambah row item baru ke tabel PO
 * Fungsi ini digunakan untuk menambahkan item dari PR atau item manual
 * 
 * Proses:
 * 1. Clone template row
 * 2. Assign row id unik (negatif untuk new items)
 * 3. Initialize AutoNumeric untuk format currency
 * 4. Populate data dari PR jika ada
 * 5. Setup event listeners untuk auto-calculate amount
 * 
 * @param {Object|null} prItem - Data item dari PR (opsional)
 * @param {number} prItem.id - ID PR item untuk linking
 * @param {string} prItem.item_desc - Deskripsi item
 * @param {string} prItem.uom - Satuan (unit of measurement)
 * @param {number} prItem.unit_price - Harga satuan PR (untuk referensi)
 * @param {number} prItem.quantity - Kuantitas
 * @param {number} prItem.amount - Total amount PR (untuk cost saving)
 * @param {string} prItem.pr_number - Nomor PR
 * @param {string} prItem.approved_date - Tanggal approve PR untuk SLA
 */
function addItemRow(prItem = null) {
    const template = $("#po-item-row-template").html();
    const $row = $(template);
    
    // Generate row id unik (negatif untuk membedakan dengan existing items dari DB)
    const newIndex = itemCounter--;
    // Assign stable row id untuk tracking dan AutoNumeric instances
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

    // Populate SLA Target dan SLA Realisasi jika ada (untuk restored/existing data)
    if (prItem?.sla_po_to_onsite_target !== undefined && prItem?.sla_po_to_onsite_target !== null) {
        $row.find('input[name*="sla_po_to_onsite_target"]').val(prItem.sla_po_to_onsite_target);
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
 * Rebuild AutoNumeric instances setelah row deletion atau perubahan struktur tabel
 * Diperlukan karena AutoNumeric terikat ke DOM element yang mungkin sudah berubah
 * 
 * Proses:
 * 1. Remove semua existing AutoNumeric instances
 * 2. Clear instances object
 * 3. Recreate instances untuk semua row yang tersisa di tabel
 * 4. Re-attach event listeners untuk auto-calculate amount
 * 
 * Catatan: Fungsi ini juga dipanggil saat page load untuk initialize existing items
 */
function rebuildAutoNumericInstances() {
    // Hapus semua existing instances dengan error handling
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

    // Clear instances object
    autoNumericInstances = {};

    // Recreate instances untuk semua remaining rows
    $("#po-items-container tr").each(function(index) {
        const $row = $(this);
        // Pastikan row memiliki stable id
        let rowId = $row.attr('data-row-id');
        if (!rowId) {
            rowId = --itemCounter; // Use negative counter for new items
            $row.attr('data-row-id', rowId);
        }
        
        const unitPriceInput = $row.find('input[name$="[unit_price]"]')[0];
        const amountInput = $row.find('input[name$="[amount]"]')[0];

        // Skip jika tidak ada input (e.g., empty state row)
        if (!unitPriceInput) return;

        // Initialize atau reuse existing AutoNumeric instance untuk unit_price
        if (unitPriceInput) {
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

            // Remove old event handlers dan add new untuk prevent duplicate events
            $(unitPriceInput).off('input keyup blur autoNumeric:rawValueModified change')
                .on('input keyup blur autoNumeric:rawValueModified change', function() {
                calculateRowAmount($row);
            });
        }

        // Initialize atau reuse existing AutoNumeric instance untuk amount
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
 * Renumber items setelah add/remove untuk menampilkan nomor urut yang benar
 * Hanya visual numbering, tidak mempengaruhi data yang dikirim ke server
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
 * Kalkulasi amount untuk satu row item (quantity × unit_price)
 * Fungsi dipanggil otomatis saat quantity atau unit_price berubah
 * 
 * @param {jQuery} $row - jQuery object dari row yang akan dikalkulasi
 */
function calculateRowAmount($row) {
    const rowId = $row.attr('data-row-id');
    const quantity = parseFloat($row.find(".po-item-quantity").val()) || 0;
    
    const unitPriceInstance = autoNumericInstances[`unit_price_${rowId}`];
    const amountInstance = autoNumericInstances[`amount_${rowId}`];
    
    // Skip jika AutoNumeric belum terinisialisasi
    if (!unitPriceInstance || !amountInstance) return;
    
    const unitPrice = unitPriceInstance.getNumber() || 0;
    const amount = quantity * unitPrice;
    
    // Set amount dengan format currency otomatis
    amountInstance.set(amount);
}

/**
 * Setup form submit untuk UPDATE Purchase Order
 * Proses:
 * 1. Validasi form (nomor PO, tanggal, supplier, items)
 * 2. Konfirmasi update ke user
 * 3. Collect data items (termasuk id untuk existing items)
 * 4. Kirim ke server via PUT/PATCH method
 * 5. Handle response (success/error)
 * 6. Redirect ke index setelah sukses
 */
function setupFormSubmit() {
    $("#form-create-po").on("submit", async function(e) {
        e.preventDefault();
        
        // Clear previous field errors
        clearAllFieldErrors();
        
        // Validasi form sebelum submit
        const validation = validateForm();
        if (!validation.isValid) {
            showError(validation.message);
            return;
        }

        // Jika ada beberapa items dengan SLA < 1 (tapi tidak semua), beri warning
        const itemsCount = $("#po-items-container tr").not('.text-center.text-gray-500').length;
        if (validation.lowSLACount > 0 && validation.lowSLACount < itemsCount) {
            const confirmed = await confirmAction(
                `Terdapat ${validation.lowSLACount} item dengan SLA Realisasi < 1 (tanggal PR lebih besar dari tanggal PO). Item tersebut tidak akan disimpan. Lanjutkan?`,
                'Konfirmasi Simpan dengan Item Bermasalah'
            );
            
            if (!confirmed) return;
        }

        // Konfirmasi update sebelum submit
        const confirmed = await confirmAction(
            "Data purchase order akan diupdate di sistem.",
            "Konfirmasi Update"
        );
        
        if (!confirmed) return;

        // Disable submit button untuk prevent double submission
        const btn = $(this).find('button[type="submit"]');
        const originalText = btn.html();
        btn.prop("disabled", true).html('<i class="mgc_loading_line animate-spin me-2"></i>Mengupdate...');

        try {
            const formData = new FormData(this);
            
            // Collect items dari tabel (exclude empty state row)
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
                
                // Include id untuk existing items (untuk update)
                // New items akan memiliki id negatif atau null
                const itemId = $r.find('input[name*="[id]"]').val();
                
                items.push({
                    id: itemId && itemId > 0 ? itemId : null, // id existing item atau null untuk new item
                    purchase_request_item_id: $r.find('.po-pr-item-id').val() || null,
                    pr_amount: prAmount,
                    unit_price: unitPrice,
                    quantity: parseInt($r.find('.po-item-quantity').val()) || 0,
                    amount: amount,
                    sla_po_to_onsite_target: $r.find('input[name*="sla_po_to_onsite_target"]').val() || null,
                    sla_pr_to_po_realization: $r.find('input[name*="sla_pr_to_po_realization"]').val() || null,
                });
            });

            // Append items as JSON string
            formData.append('items', JSON.stringify(items));

            // Submit form ke server
            const response = await fetch($(this).attr('action'), {
                method: 'POST', // Laravel akan handle PUT method dari _method field
                headers: {
                    'Accept': 'application/json',
                },
                body: formData
            });

            const data = await response.json();

            // Handle error response
            if (!response.ok) {
                if (data.errors) {
                    displayFieldErrors(data.errors);
                }
                showError(data.message || 'Gagal mengupdate PO');
                return;
            }

            // Success - tampilkan notifikasi dan redirect
            showSuccess('PO berhasil diupdate');
            
            // Use redirect URL from response or default to index
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                window.location.href = route('purchase-order.index');
            }

        } catch (error) {
            console.error('Error:', error);
            showError('Terjadi kesalahan: ' + error.message);
        } finally {
            // Re-enable submit button
            btn.prop("disabled", false).html(originalText);
        }
    });
}

/**
 * Validasi form sebelum submit
 * Validasi meliputi:
 * - PO Number harus diisi
 * - Approved Date harus diisi
 * - Supplier harus dipilih
 * - Minimal harus ada 1 item
 * - Setiap item harus memiliki unit_price > 0 dan quantity > 0
 * - Tidak semua items boleh memiliki SLA Realisasi < 1 (tanggal PR > tanggal PO)
 * 
 * @returns {Object} {isValid: boolean, message: string, lowSLACount: number}
 */
function validateForm() {
const poNumber = $("#po_number").val().trim();
const approvedDate = $("#approved_date").val().trim();
const supplierId = $("#supplier_id").val();
const itemRows = $("#po-items-container tr").not('.text-center.text-gray-500');
const itemsCount = itemRows.length;

    if (!poNumber) {
        return { isValid: false, message: "PO Number harus diisi", lowSLACount: 0 };
    }

    if (!approvedDate) {
        return { isValid: false, message: "Approved Date harus diisi", lowSLACount: 0 };
    }

    if (!supplierId) {
        return { isValid: false, message: "Supplier harus dipilih", lowSLACount: 0 };
    }

    if (itemsCount === 0) {
        return { isValid: false, message: "Minimal harus ada 1 item dari PR. Klik 'Ambil Data PR' untuk menambah item.", lowSLACount: 0 };
    }

    // Hitung items dengan SLA Realisasi < 1 (tanggal PR lebih besar dari tanggal PO)
    let lowSLACount = 0;
    let isValid = true;
    let errorMessage = "";

    itemRows.each(function(index) {
        const $r = $(this);
        const rowId = $r.attr('data-row-id');
        const unitPriceInstance = autoNumericInstances[`unit_price_${rowId}`];
        const quantity = parseFloat($r.find('.po-item-quantity').val()) || 0;
        const unitPrice = unitPriceInstance ? unitPriceInstance.getNumber() : 0;
        const slaTarget = $r.find('input[name*="sla_po_to_onsite_target"]').val();
        const slaRealization = parseFloat($r.find('input[name*="sla_pr_to_po_realization"]').val()) || 0;

        // Count items dengan SLA < 1
        if (slaRealization < 1) {
            lowSLACount++;
        }

        if (unitPrice <= 0) {
            isValid = false;
            errorMessage = `Item ${index + 1}: Harga satuan harus lebih dari 0`;
            return false; // Break loop
        }

        if (quantity <= 0) {
            isValid = false;
            errorMessage = `Item ${index + 1}: Quantity harus lebih dari 0`;
            return false; // Break loop
        }

        if (!slaTarget || slaTarget === '' || parseFloat(slaTarget) <= 0) {
            isValid = false;
            errorMessage = `Item ${index + 1}: SLA Target harus diisi dan lebih dari 0`;
            return false; // Break loop
        }
    });

    if (!isValid) {
        return { isValid: false, message: errorMessage, lowSLACount };
    }

    // Jika SEMUA items memiliki SLA < 1, jangan simpan
    if (lowSLACount === itemsCount) {
        return { 
            isValid: false, 
            message: "Semua item memiliki SLA Realisasi < 1. Tanggal Approved PO harus lebih besar dari tanggal Approved PR.", 
            lowSLACount 
        };
    }

    return { isValid: true, lowSLACount };
}

/**
 * Setup event listeners untuk clear error message saat user mulai input
 * Meningkatkan UX dengan memberikan feedback real-time
 */
function setupErrorClearListeners() {
    $('#po_number').on('input', function() {
        clearFieldError('po_number');
    });

    $('#supplier_id').on('change', function() {
        clearFieldError('supplier_id');
    });
}

/**
 * Capture initial form state pada saat page load
 * Digunakan untuk mendeteksi apakah ada perubahan di form
 */
function captureInitialFormState() {
    initialFormState = {
        po_number: $("#po_number").val().trim(),
        approved_date: $("#approved_date").val().trim(),
        supplier_id: $("#supplier_id").val(),
        notes: $("#notes").val().trim(),
        items: getItemsSnapshot()
    };
    
    // Update current state
    updateCurrentFormState();
    
    // Disable update button awalnya karena belum ada perubahan
    updateSubmitButtonState();
}

/**
 * Update current form state
 */
function updateCurrentFormState() {
    currentFormState = {
        po_number: $("#po_number").val().trim(),
        approved_date: $("#approved_date").val().trim(),
        supplier_id: $("#supplier_id").val(),
        notes: $("#notes").val().trim(),
        items: getItemsSnapshot()
    };
}

/**
 * Get snapshot of all items untuk perbandingan state
 */
function getItemsSnapshot() {
    const items = [];
    $('#po-items-container tr').not('.text-center.text-gray-500').each(function() {
        const $r = $(this);
        const rowId = $r.attr('data-row-id');
        const unitPriceInstance = autoNumericInstances[`unit_price_${rowId}`];
        const amountInstance = autoNumericInstances[`amount_${rowId}`];
        
        items.push({
            id: $r.find('input[name*="[id]"]').val(),
            pr_item_id: $r.find('.po-pr-item-id').val(),
            unit_price: unitPriceInstance ? unitPriceInstance.getNumber() : 0,
            quantity: $r.find('.po-item-quantity').val(),
            amount: amountInstance ? amountInstance.getNumber() : 0,
            sla_po_to_onsite_target: $r.find('input[name*="sla_po_to_onsite_target"]').val(),
            sla_pr_to_po_realization: $r.find('input[name*="sla_pr_to_po_realization"]').val()
        });
    });
    return JSON.stringify(items);
}

/**
 * Cek apakah ada perubahan di form
 */
function checkForChanges() {
    updateCurrentFormState();
    
    hasChanges = initialFormState.po_number !== currentFormState.po_number ||
                 initialFormState.approved_date !== currentFormState.approved_date ||
                 initialFormState.supplier_id !== currentFormState.supplier_id ||
                 initialFormState.notes !== currentFormState.notes ||
                 initialFormState.items !== currentFormState.items;
    
    return hasChanges;
}

/**
 * Update state tombol submit berdasarkan ada/tidaknya perubahan
 */
function updateSubmitButtonState() {
    const hasChanged = checkForChanges();
    const submitBtn = $("#form-create-po").find('button[type="submit"]');
    
    if (hasChanged) {
        submitBtn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
    } else {
        submitBtn.prop('disabled', true).addClass('opacity-50 cursor-not-allowed');
    }
}

/**
 * Setup change detection listeners untuk semua form fields
 */
function setupChangeDetection() {
    // Listen to PO number changes
    $(document).on('input', '#po_number', function() {
        updateSubmitButtonState();
    });
    
    // Listen to approved date changes
    $(document).on('input change', '#approved_date', function() {
        updateSubmitButtonState();
    });
    
    // Listen to supplier changes
    $(document).on('change', '#supplier_id', function() {
        updateSubmitButtonState();
    });
    
    // Listen to notes changes
    $(document).on('input', '#notes', function() {
        updateSubmitButtonState();
    });
    
    // Listen to item changes (quantity, unit_price, SLA fields)
    $(document).on('input change', '.po-item-quantity, input[name*="[unit_price]"], input[name*="[sla_po_to_onsite_target]"]', function() {
        updateSubmitButtonState();
    });
    
    // Override item removal to detect changes
    const originalDeleteItems = window.deleteSelectedItems;
    window.deleteSelectedItems = async function() {
        await originalDeleteItems.call(this);
        updateSubmitButtonState();
    };
    
    // Override recalculate SLA to detect changes
    const originalRecalculate = window.recalculateSLARealisasi;
    window.recalculateSLARealisasi = function(date) {
        originalRecalculate.call(this, date);
        updateSubmitButtonState();
    };
}

// Initialize on document ready
$(document).ready(function() {
    initPOUpdate();
    setupErrorClearListeners();
});

export default initPOUpdate;
