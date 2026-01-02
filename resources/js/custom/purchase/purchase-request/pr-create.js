/**
 * Modul Purchase Request - Create
 * Mengelola form create purchase request dengan dynamic items
 */

import { showToast, showError, confirmAction } from "../../../core/notification.js";
import { route } from "ziggy-js";
import $ from "jquery";
import AutoNumeric from "autonumeric";
import flatpickr from "flatpickr";

let itemCounter = 0;
let autoNumericInstances = {};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

function formatDisplayShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    const day = `${d.getDate()}`.padStart(2, '0');
    const month = MONTH_NAMES[d.getMonth()];
    const yearShort = `${d.getFullYear()}`.slice(-2);
    return `${day}-${month}-${yearShort}`;
}

function parseDisplayToYmd(displayStr) {
    if (!displayStr) return null;
    const match = displayStr.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const monAbbr = match[2].toLowerCase();
    const yearTwo = parseInt(match[3], 10);
    const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === monAbbr);
    if (monthIndex === -1 || day < 1 || day > 31) return null;
    const fullYear = 2000 + yearTwo;
    const month = `${monthIndex + 1}`.padStart(2, '0');
    const dayStr = `${day}`.padStart(2, '0');
    return `${fullYear}-${month}-${dayStr}`;
}

function normalizeApprovedDateInput($input) {
    if (!$input || !$input.length) return null;
    const raw = $input.val().trim();
    if (!raw) return null;

    const existingYmd = parseDisplayToYmd(raw);
    if (existingYmd) {
        $input.val(formatDisplayShort(existingYmd));
        return existingYmd;
    }

    const numericMatch = raw.match(/^(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2,4})$/);
    if (!numericMatch) return null;

    const day = parseInt(numericMatch[1], 10);
    const monthNum = parseInt(numericMatch[2], 10);
    const yearRaw = parseInt(numericMatch[3], 10);

    if (Number.isNaN(day) || Number.isNaN(monthNum) || Number.isNaN(yearRaw)) return null;
    if (day < 1 || day > 31 || monthNum < 1 || monthNum > 12) return null;

    const fullYear = numericMatch[3].length === 2 ? 2000 + yearRaw : yearRaw;
    const yearTwo = `${fullYear}`.slice(-2);
    const monthIndex = monthNum - 1;
    const monthAbbr = MONTH_NAMES[monthIndex];
    const monthStr = `${monthNum}`.padStart(2, '0');
    const dayStr = `${day}`.padStart(2, '0');
    const ymd = `${fullYear}-${monthStr}-${dayStr}`;

    $input.val(`${dayStr}-${monthAbbr}-${yearTwo}`);
    return ymd;
}

/**
 * Initialize PR Create form
 */
export function initPRCreate() {
    if (!$("#form-create-pr").length) return;

    setupFormSubmit();
    setupDynamicItems();
    setupApprovedDateFormatting();
    setupPRNumberCheck();
    injectCustomStyles();
    
    // Add first row automatically
    addItemRow();
}

/**
 * Setup dynamic items (add/remove rows)
 */
function setupDynamicItems() {
    // Add item button
    $("#btn-add-item").on("click", function() {
        addItemRow();
    });

    // Remove item button (delegated)
    $(document).on("click", ".btn-remove-item", function() {
        const row = $(this).closest("tr");
        const rowCount = $("#items-container tr").length;
        
        if (rowCount <= 1) {
            showToast('Minimal harus ada 1 item', 'warning', 2000);
            return;
        }

        // Remove row and rebuild AutoNumeric instances
        row.remove();
        rebuildAutoNumericInstances();
        renumberItems();
    });

    // Quantity change - calculate amount and check for deleted items
    $(document).on("input", ".item-quantity", function() {
        const $row = $(this).closest("tr");
        calculateRowAmount($row);
    });

    // When qty input loses focus, check for deleted items
    $(document).on("blur", ".item-quantity", async function() {
        const $row = $(this).closest("tr");
        const qty = parseFloat($(this).val());
        
        // Only check if qty is valid and > 0
        if (qty && qty > 0) {
            await checkDeletedItemForRow($row);
        }
    });
    
    // Handle classification input untuk matching dengan datalist
    $(document).on("input change", ".classification-input", function() {
        const $input = $(this);
        const $row = $input.closest("tr");
        const $hiddenId = $row.find(".classification-id");
        const inputValue = $input.val().trim();
        
        // Jika input kosong, reset
        if (!inputValue) {
            $hiddenId.val("");
            $input.removeClass("border-green-500 border-amber-500");
            return;
        }
        
        // Cari matching option di datalist
        const datalistId = $input.attr("list");
        const $datalist = $(`#${datalistId}`);
        let foundId = "";
        
        $datalist.find("option").each(function() {
            const optionValue = $(this).val();
            const optionId = $(this).attr("data-id");
            
            // Exact match (case insensitive)
            if (optionValue.toLowerCase() === inputValue.toLowerCase()) {
                foundId = optionId;
                return false; // break loop
            }
        });
        
        // Set hidden ID dan visual feedback
        if (foundId) {
            // Match ditemukan - set ID dan border hijau
            $hiddenId.val(foundId);
            $input.removeClass("border-amber-500").addClass("border-green-500");
        } else {
            // Tidak match - kosongkan ID dan border kuning (manual input)
            $hiddenId.val("");
            $input.removeClass("border-green-500").addClass("border-amber-500");
        }
    });
    
    // Handle blur (selesai input) - pastikan ID kosong jika tidak ada match
    $(document).on("blur", ".classification-input", function() {
        const $input = $(this);
        const $row = $input.closest("tr");
        const $hiddenId = $row.find(".classification-id");
        const inputValue = $input.val().trim();
        
        // Jika input kosong, reset semua
        if (!inputValue) {
            $hiddenId.val("");
            $input.removeClass("border-green-500 border-amber-500");
            return;
        }
        
        // Cari matching option di datalist
        const datalistId = $input.attr("list");
        const $datalist = $(`#${datalistId}`);
        let foundId = "";
        
        $datalist.find("option").each(function() {
            const optionValue = $(this).val();
            const optionId = $(this).attr("data-id");
            
            if (optionValue.toLowerCase() === inputValue.toLowerCase()) {
                foundId = optionId;
                return false;
            }
        });
        
        // Final validation saat blur
        if (foundId) {
            // Match ditemukan
            $hiddenId.val(foundId);
            $input.removeClass("border-amber-500").addClass("border-green-500");
        } else {
            // Tidak ada match - pastikan ID kosong
            $hiddenId.val("");
            $input.removeClass("border-green-500").addClass("border-amber-500");
        }
    });
}

function setupApprovedDateFormatting() {
    flatpickr("#approved_date", {
        altInput: true,
        altFormat: "d-M-y",
        dateFormat: "Y-m-d",
        allowInput: true,
        locale: { firstDayOfWeek: 1 }
    });
}

/**
 * Add new item row
 */
function addItemRow() {
    const template = $("#item-row-template").html();
    const $row = $(template);
    
    // Update row index
    const newIndex = itemCounter++;
    $row.find("select, input").each(function() {
        const name = $(this).attr("name");
        if (name) {
            $(this).attr("name", name.replace("[0]", `[${newIndex}]`));
        }
    });
    
    // Update datalist ID untuk unique per row
    const $classificationInput = $row.find(".classification-input");
    const newDatalistId = `classification-list-${newIndex}`;
    $classificationInput.attr("list", newDatalistId);
    $row.find("datalist").attr("id", newDatalistId);

    $("#items-container").append($row);
    
    // Initialize AutoNumeric for currency fields in this row
    const rowIndex = $row.index();
    const unitPriceInput = $row.find('input[name*="unit_price"]')[0];
    const amountInput = $row.find('input[name*="amount"]')[0];
    if (unitPriceInput) {
        autoNumericInstances[`unit_price_${rowIndex}`] = new AutoNumeric(unitPriceInput, {
            currencySymbol: '',
            currencySymbolPlacement: 's',
            decimalCharacter: ',',
            digitGroupSeparator: '.',
            decimalPlaces: 0,
            unformatOnSubmit: true,
            minimumValue: '0',
        });
        
        // Listen to changes on unit price
        $(unitPriceInput).on('change', function() {
            calculateRowAmount($row);
        });
    }
    
    if (amountInput) {
        autoNumericInstances[`amount_${rowIndex}`] = new AutoNumeric(amountInput, {
            currencySymbol: '',
            currencySymbolPlacement: 's',
            decimalCharacter: ',',
            digitGroupSeparator: '.',
            decimalPlaces: 0,
            unformatOnSubmit: true,
            minimumValue: '0',
        });
    }

    renumberItems();
}

/**
 * Rebuild AutoNumeric instances after row deletion
 */
function rebuildAutoNumericInstances() {
    // Remove all existing instances
    Object.keys(autoNumericInstances).forEach(key => {
        if (autoNumericInstances[key]) {
            autoNumericInstances[key].remove();
            delete autoNumericInstances[key];
        }
    });

    // Recreate instances for all remaining rows
    $("#items-container tr").each(function(index) {
        const $row = $(this);
        const unitPriceInput = $row.find('input[name*="unit_price"]')[0];
        const amountInput = $row.find('input[name*="amount"]')[0];

        if (unitPriceInput && !autoNumericInstances[`unit_price_${index}`]) {
            autoNumericInstances[`unit_price_${index}`] = new AutoNumeric(unitPriceInput, {
                currencySymbol: '',
                currencySymbolPlacement: 's',
                decimalCharacter: ',',
                digitGroupSeparator: '.',
                decimalPlaces: 0,
                unformatOnSubmit: true,
                minimumValue: '0',
            });

            $(unitPriceInput).on('change', function() {
                calculateRowAmount($row);
            });
        }

        if (amountInput && !autoNumericInstances[`amount_${index}`]) {
            autoNumericInstances[`amount_${index}`] = new AutoNumeric(amountInput, {
                currencySymbol: '',
                currencySymbolPlacement: 's',
                decimalCharacter: ',',
                digitGroupSeparator: '.',
                decimalPlaces: 0,
                unformatOnSubmit: true,
                minimumValue: '0',
            });
        }
    });
}

/**
 * Renumber items after add/remove
 */
function renumberItems() {
    $("#items-container tr").each(function(index) {
        $(this).find(".item-number").text(index + 1);
        
        // Update name attributes with correct index
        $(this).find("select, input").each(function() {
            const name = $(this).attr("name");
            if (name) {
                $(this).attr("name", name.replace(/\[\d+\]/, `[${index}]`));
            }
        });
    });
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
    const rowIndex = $row.index();
    const quantity = parseFloat($row.find(".item-quantity").val()) || 0;
    
    const unitPriceInstance = autoNumericInstances[`unit_price_${rowIndex}`];
    const amountInstance = autoNumericInstances[`amount_${rowIndex}`];
    
    if (!unitPriceInstance || !amountInstance) return;
    
    const unitPrice = unitPriceInstance.getNumber() || 0;
    const amount = quantity * unitPrice;
    
    amountInstance.set(amount);
}

/**
 * Setup form submit
 */
function setupFormSubmit() {
    $("#form-create-pr").on("submit", async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearAllFieldErrors();
        
        // Validate form
        const validation = validateForm();
        if (!validation.isValid) {
            showToast(validation.message, 'error', 3000);
            return;
        }

        // Confirm before submit
        const confirmed = await confirmAction(
            "Data purchase request akan disimpan ke sistem.",
            "Konfirmasi Simpan"
        );
        
        if (!confirmed) return;

        const btn = $(this).find('button[type="submit"]');
        const originalText = btn.html();
        btn.prop("disabled", true).html('<i class="mgc_loading_line animate-spin me-2"></i>Menyimpan...');

        try {
            // Unformat currency fields before submit (set raw number into input value)
            Object.values(autoNumericInstances).forEach(instance => {
                const raw = instance.getNumber();
                const el = instance.domElement || instance.input || instance.element;
                if (el) {
                    el.value = raw;
                }
            });

            const formData = new FormData(this);
            
            // Add restore item IDs if any rows are marked for restoration
            const restoreIds = [];
            $("#items-container tr").each(function() {
                const restoreId = $(this).attr('data-restore-item-id');
                if (restoreId) {
                    restoreIds.push(restoreId);
                }
            });
            
            if (restoreIds.length > 0) {
                formData.append('restore_item_ids', JSON.stringify(restoreIds));
            }
            
            const response = await $.ajax({
                url: $(this).attr("action"),
                method: "POST",
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                },
            });

            showToast('Purchase request berhasil ditambahkan!', 'success', 2000);
            setTimeout(() => {
                window.location.href = route('purchase-request.index');
            }, 500);

        } catch (error) {
            console.error('Error:', error);
            
            // Handle validation errors (422)
            if (error.status === 422 && error.responseJSON?.errors) {
                displayFieldErrors(error.responseJSON.errors);
                showToast('Periksa kembali form Anda', 'error', 3000);
            } else {
                const message = error.responseJSON?.message || 'Terjadi kesalahan saat menyimpan data';
                showToast(message, 'error', 3000);
            }
            
            btn.prop("disabled", false).html(originalText);
        }
    });
}

/**
 * Validate form before submit
 */
function validateForm() {
    const prNumber = $("#pr_number").val().trim();
    const approvedDate = $("#approved_date").val().trim();
    const requestType = $("#request_type").val().trim();
    const locationId = $("#location_id").val();
    const itemsCount = $("#items-container tr").length;

    if (!prNumber) {
        return { isValid: false, message: "PR Number harus diisi" };
    }

    if (!approvedDate) {
        return { isValid: false, message: "Approved Date harus diisi" };
    }

    if (!requestType) {
        return { isValid: false, message: "Request Type harus diisi" };
    }

    if (!locationId) {
        return { isValid: false, message: "Location harus diisi" };
    }

    if (itemsCount === 0) {
        return { isValid: false, message: "Minimal harus ada 1 item" };
    }

    // Validate each item and check for duplicates
    let isValid = true;
    let errorMessage = "";
    const items = [];

    $("#items-container tr").each(function(index) {
        const classificationId = $(this).find('select[name*="classification_id"]').val();
        const itemDesc = $(this).find('input[name*="item_desc"]').val().trim();
        const uom = $(this).find('input[name*="uom"]').val().trim();
        const quantity = parseFloat($(this).find('input[name*="quantity"]').val()) || 0;
        
        const rowIndex = $(this).index();
        const unitPriceInstance = autoNumericInstances[`unit_price_${rowIndex}`];
        const unitPrice = unitPriceInstance ? unitPriceInstance.getNumber() : 0;

        if (!itemDesc) {
            isValid = false;
            errorMessage = `Item #${index + 1}: Item Description harus diisi`;
            return false;
        }

        if (!uom) {
            isValid = false;
            errorMessage = `Item #${index + 1}: UOM harus diisi`;
            return false;
        }

        if (unitPrice <= 0) {
            isValid = false;
            errorMessage = `Item #${index + 1}: Unit Price harus lebih dari 0`;
            return false;
        }

        if (quantity <= 0) {
            isValid = false;
            errorMessage = `Item #${index + 1}: Quantity harus lebih dari 0`;
            return false;
        }

        // Validate SLA PR→PO Target (required, integer >= 0)
        const slaTargetRaw = $(this).find('input[name*="sla_pr_to_po_target"]').val();
        const slaTarget = slaTargetRaw !== undefined && slaTargetRaw !== null && slaTargetRaw !== '' ? parseInt(slaTargetRaw, 10) : NaN;
        if (Number.isNaN(slaTarget) || slaTarget < 0) {
            isValid = false;
            errorMessage = `Item #${index + 1}: SLA PR→PO Target (hari) wajib diisi dan >= 0`;
            return false;
        }

        // Store item data for duplicate checking
        items.push({
            index: index + 1,
            itemDesc: itemDesc.toLowerCase(),
            uom: uom.toLowerCase(),
            unitPrice: unitPrice
        });
    });

    // Check for duplicates (all 3 columns must match)
    if (isValid) {
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                if (items[i].itemDesc === items[j].itemDesc && 
                    items[i].uom === items[j].uom && 
                    items[i].unitPrice === items[j].unitPrice) {
                    isValid = false;
                    errorMessage = `Item #${items[i].index} dan #${items[j].index} memiliki Item Description, UOM, dan Unit Price yang sama (duplikat)`;
                    return { isValid: false, message: errorMessage };
                }
            }
        }
    }

    if (!isValid) {
        return { isValid: false, message: errorMessage };
    }

    return { isValid: true };
}

/**
 * Check for deleted item when qty is entered in a row
 */
async function checkDeletedItemForRow($row) {
    const itemDesc = $row.find('input[name*="item_desc"]').val().trim();
    const uom = $row.find('input[name*="uom"]').val().trim();
    const rowIndex = $row.index();
    const unitPriceInstance = autoNumericInstances[`unit_price_${rowIndex}`];
    const unitPrice = unitPriceInstance ? unitPriceInstance.getNumber() : 0;
    const prNumber = $('#pr_number').val().trim();

    // Only check if all three fields are filled
    if (!itemDesc || !uom || !unitPrice || unitPrice <= 0 || !prNumber) {
        return;
    }

    try {
        const response = await $.ajax({
            url: route('purchase-request.checkDeletedItem'),
            method: 'POST',
            data: {
                pr_number: prNumber,
                item_desc: itemDesc,
                uom: uom,
                unit_price: unitPrice
            },
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });

        if (response.has_deleted_item && response.deleted_item) {
            const item = response.deleted_item;
            
            const confirmed = await confirmAction(
                `Data item "${item.item_desc}" dengan UOM "${item.uom}" dan Unit Price ${new Intl.NumberFormat('id-ID').format(item.unit_price)} pernah diinput sebelumnya.\n\nApakah Anda ingin mengaktifkan kembali data tersebut?`,
                'Item Pernah Diinput',
                {
                    confirmButtonText: 'Ya, Aktifkan Kembali',
                    cancelButtonText: 'Tidak, Input Manual',
                    showCancelButton: true
                }
            );

            if (confirmed) {
                // Auto-fill classification if available
                if (item.classification_id) {
                    const $classSelect = $row.find('select[name*="classification_id"]');
                    $classSelect.val(item.classification_id);
                }
                
                // Auto-fill quantity and amount from deleted item
                const $qtyInput = $row.find('input[name*="quantity"]');
                const amountInstance = autoNumericInstances[`amount_${rowIndex}`];
                
                $qtyInput.val(item.quantity);
                if (amountInstance) {
                    amountInstance.set(item.amount);
                }
                
                // Store deleted item ID for restoration on submit
                $row.attr('data-restore-item-id', item.id);
                $row.addClass('restore-item'); // Mark row for visual indication
                
                showToast('Data berhasil diisi dari riwayat sebelumnya', 'success', 2000);
            }
            // If not confirmed, user can continue with manual input
        }
    } catch (error) {
        console.error('Error checking deleted item:', error);
        // Continue silently on error
    }
}

/**
 * Setup input event listeners to clear errors
 */
function setupErrorClearListeners() {
    $('#pr_number').on('input', function() {
        clearFieldError('pr_number');
    });
}

/**
 * Setup PR Number check untuk deleted PR
 */
function setupPRNumberCheck() {
    let prCheckTimeout = null;
    
    $('#pr_number').on('input blur', function() {
        const prNumber = $(this).val().trim();
        
        // Clear previous timeout
        if (prCheckTimeout) {
            clearTimeout(prCheckTimeout);
        }
        
        // Only check if PR number is not empty
        if (!prNumber) {
            return;
        }
        
        // Debounce check (wait 800ms after user stops typing)
        prCheckTimeout = setTimeout(async () => {
            await checkDeletedPR(prNumber);
        }, 800);
    });
}

/**
 * Check apakah PR Number sudah pernah diinput (soft deleted)
 */
async function checkDeletedPR(prNumber) {
    try {
        const response = await $.ajax({
            url: route('purchase-request.checkDeletedPR'),
            method: 'POST',
            data: { pr_number: prNumber },
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });

        if (response.has_deleted_pr && response.deleted_pr) {
            const pr = response.deleted_pr;
            
            const confirmed = await confirmAction(
                `PR Number "${pr.pr_number}" pernah diinput sebelumnya dengan ${pr.items.length} item(s), namun telah dihapus.\n\nApakah Anda ingin mengaktifkan kembali data tersebut?\n\nJika ya, semua data PR dan items akan otomatis terisi.`,
                'PR Pernah Diinput',
                {
                    confirmButtonText: 'Ya, Aktifkan Kembali',
                    cancelButtonText: 'Tidak, Input Manual',
                    showCancelButton: true
                }
            );

            if (confirmed) {
                // Restore PR beserta items
                await restoreAndFillPR(pr);
            }
        }
    } catch (error) {
        console.error('Error checking deleted PR:', error);
        // Continue silently on error
    }
}

/**
 * Restore PR dan auto-fill form dengan data PR yang dihapus
 */
async function restoreAndFillPR(pr) {
    try {
        // Call restore endpoint
        const response = await $.ajax({
            url: route('purchase-request.restore', { id: pr.id }),
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });

        // Auto-fill form fields
        $('#pr_number').val(pr.pr_number);
        $('#request_type').val(pr.request_type);
        $('#notes').val(pr.notes || '');
        
        // Fill approved date
        if (pr.approved_date) {
            $('#approved_date').val(pr.approved_date);
            // Trigger flatpickr update
            const flatpickrInstance = $('#approved_date')[0]._flatpickr;
            if (flatpickrInstance) {
                flatpickrInstance.setDate(pr.approved_date, true);
            }
        }
        
        // Fill location (if super admin)
        if (pr.location_id) {
            $('#location_id').val(pr.location_id);
        }

        // Clear existing items
        $('#items-container').empty();
        itemCounter = 0;
        
        // Rebuild AutoNumeric instances
        rebuildAutoNumericInstances();

        // Add all items from deleted PR
        for (const item of pr.items) {
            addItemRow();
            const $lastRow = $('#items-container tr:last');
            const rowIndex = $lastRow.index();
            
            // Fill classification
            if (item.classification_id && item.classification_name) {
                $lastRow.find('.classification-input').val(item.classification_name).addClass('border-green-500');
                $lastRow.find('.classification-id').val(item.classification_id);
            }
            
            // Fill item fields
            $lastRow.find('input[name*="item_desc"]').val(item.item_desc);
            $lastRow.find('input[name*="uom"]').val(item.uom);
            $lastRow.find('input[name*="quantity"]').val(item.quantity);
            
            // Set unit price and amount using AutoNumeric
            const unitPriceInstance = autoNumericInstances[`unit_price_${rowIndex}`];
            const amountInstance = autoNumericInstances[`amount_${rowIndex}`];
            
            if (unitPriceInstance) {
                unitPriceInstance.set(item.unit_price);
            }
            
            if (amountInstance) {
                amountInstance.set(item.amount);
            }
        }

        showToast('Data PR berhasil diaktifkan kembali! Silakan review dan simpan.', 'success', 3000);
        
        // Redirect to index after successful restore
        setTimeout(() => {
            window.location.href = route('purchase-request.index');
        }, 1500);
        
    } catch (error) {
        console.error('Error restoring PR:', error);
        const message = error.responseJSON?.message || 'Gagal mengaktifkan kembali PR';
        showToast(message, 'error', 3000);
    }
}

// Initialize on document ready
$(document).ready(function() {
    initPRCreate();
    setupErrorClearListeners();
});

export default initPRCreate;
