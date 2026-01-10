/**
 * Modul Invoice - Create
 * Menangani pemilihan PO Onsite dengan checkbox dan generasi form invoice
 */
import $ from "jquery";
import flatpickr from "flatpickr";
import Id from "flatpickr/dist/l10n/id";
import { route } from "ziggy-js";
import { Grid, h } from "gridjs";
import { showToast, showError } from "../../../core/notification";

flatpickr.localize(Id);

// Persistent selection store across pagination/search
const selectedOnsiteIds = new Set();
const selectedItemsData = new Map();

$(document).ready(function () {
    initInvoiceCreate();
});

export function initInvoiceCreate() {
    setupGridJS();
    setupTableToggle();
}

/**
 * Setup Checkbox handlers untuk selection (DEPRECATED - Use setupCheckboxHandlersGridJS)
 */
function setupCheckboxHandlers() {
    // This function is no longer used with GridJS
    // setupCheckboxHandlersGridJS() handles checkbox events with event delegation
}

/**
 * Setup GridJS untuk menampilkan tabel PO Onsite dengan pagination dan search
 */
function setupGridJS() {
    $.ajax({
        url: route("dari-vendor.get-onsites"),
        method: "GET",
        success: function (data) {
            const columns = [
                {
                    id: "checkbox",
                    name: h('div', { innerHTML: '<input type="checkbox" id="select-all-checkbox" class="form-checkbox rounded text-primary">' }),
                    width: "60px",
                    sort: false,
                    formatter: (cell) => h('div', { innerHTML: cell }),
                },
                { id: "po_number", name: "PO Number", width: "120px" },
                { id: "pr_number", name: "PR Number", width: "120px" },
                { id: "supplier", name: "Supplier", width: "150px" },
                { id: "item_desc", name: "Item Description", width: "200px" },
                { id: "unit_price", name: "Unit Price", width: "120px", sort: false },
                { id: "quantity", name: "Qty", width: "100px", sort: false },
                { id: "amount", name: "Amount", width: "120px", sort: false },
                { id: "onsite_date", name: "Onsite Date", width: "120px" },
            ];

            const gridData = data.map((item) => [
                item.checkbox,
                item.po_number,
                item.pr_number,
                item.supplier,
                item.item_desc,
                item.unit_price,
                item.quantity,
                item.amount,
                item.onsite_date,
            ]);

            // Initialize GridJS
            const grid = new Grid({
                columns: columns,
                data: gridData,
                pagination: { limit: 10 },
                search: { enabled: true, ignoreHiddenColumns: false },
                sort: true,
            });

            grid.render(document.querySelector("#table-onsites"));

            // Setup checkbox handlers after GridJS renders
            setTimeout(() => {
                setupCheckboxHandlersGridJS();
                restoreCheckboxStates();
            }, 300);

            // Re-apply checkbox states when GridJS re-renders (pagination/search)
            const tableContainer = document.querySelector("#table-onsites");
            if (tableContainer) {
                const observer = new MutationObserver(() => {
                    restoreCheckboxStates();
                    updateFormDisplay();
                });
                observer.observe(tableContainer, { childList: true, subtree: true });
            }
        },
        error: function (xhr) {
            console.error("Error loading onsites:", xhr);
            showError("Gagal memuat data PO Onsite", "Error!");
        },
    });
}

function setupTableToggle() {
    const $toggleBtn = $("#toggle-table");
    const $tableSection = $("#selection-card-body");
    if (!$toggleBtn.length || !$tableSection.length) return;

    const expandedLabel = '<span class="flex items-center gap-2"><i class="mgc_minimize_line text-lg"></i><span>Sembunyikan tabel</span></span>';
    const collapsedLabel = '<span class="flex items-center gap-2"><i class="mgc_arrow_down_line text-lg"></i><span>Tampilkan tabel</span></span>';

    $toggleBtn.on("click", function () {
        const isHidden = $tableSection.hasClass("hidden");
        $tableSection.toggleClass("hidden", !isHidden);
        $(this).html(isHidden ? expandedLabel : collapsedLabel);
    });
}

/**
 * Setup Checkbox handlers untuk GridJS dengan event delegation
 */
function setupCheckboxHandlersGridJS() {
    const $invoiceFormContainer = $("#invoice-form-container");
    const $invoiceForm = $("#invoice-form");
    const $btnCancel = $("#btn-cancel");

    // Handle select all checkbox - uses event delegation
    $(document).on("change", "#select-all-checkbox", function () {
        const isChecked = $(this).is(":checked");
        const $visibleCheckboxes = $("input.row-checkbox");
        $visibleCheckboxes.each(function () {
            const $cb = $(this);
            $cb.prop("checked", isChecked);
            updateSelectedStoreWithCheckbox($cb, isChecked);
        });
        updateSelectAllCheckbox();
        updateFormDisplay();
    });

    // Handle individual row checkboxes - uses event delegation
    $(document).on("change", "input.row-checkbox", function () {
        const $cb = $(this);
        const isChecked = $cb.is(":checked");
        updateSelectedStoreWithCheckbox($cb, isChecked);
        updateSelectAllCheckbox();
        updateFormDisplay();
    });

    // Update select all checkbox state
    function updateSelectAllCheckbox() {
        const $rowCheckboxes = $("input.row-checkbox");
        const totalCheckboxes = $rowCheckboxes.length;
        const checkedCheckboxes = $rowCheckboxes.filter(":checked").length;

        const $selectAllCheckbox = $("#select-all-checkbox");

        if (checkedCheckboxes === 0) {
            $selectAllCheckbox.prop("checked", false).prop("indeterminate", false);
        } else if (checkedCheckboxes === totalCheckboxes) {
            $selectAllCheckbox.prop("checked", true).prop("indeterminate", false);
        } else {
            $selectAllCheckbox.prop("checked", false).prop("indeterminate", true);
        }
    }

    // Handle Cancel button
    $btnCancel.on("click", function () {
        selectedOnsiteIds.clear();
        selectedItemsData.clear();
        $("input.row-checkbox").prop("checked", false);
        updateSelectAllCheckbox();
        updateFormDisplay();
    });

    // Handle form submission
    $invoiceForm.on("submit", function (e) {
        e.preventDefault();

        const $form = $(this);
        const onsiteIds = Array.from(selectedOnsiteIds);
        
        const invoiceNumber = $form.find("input[name='invoice_number']").val();
        const receivedDateRaw = $form.find("input[name='received_date']").val();
        const slaTarget = $form.find("input[name='sla_target']").val();

        // Validation
        if (!receivedDateRaw || !receivedDateRaw.trim()) {
            showToast("Tanggal diterima tidak boleh kosong", "warning", 2000);
            return;
        }
        if (!slaTarget || parseInt(slaTarget) < 1) {
            showToast("SLA Target harus minimal 1 hari", "warning", 2000);
            return;
        }

        // Convert date from d-m-Y to Y-m-d
        let receivedDate = receivedDateRaw;
        if (receivedDateRaw.includes('-')) {
            const parts = receivedDateRaw.split('-');
            if (parts.length === 3 && parts[0].length <= 2) {
                // Format is d-m-Y, convert to Y-m-d
                receivedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        // Prepare data for submission
        const invoiceData = {
            invoices: onsiteIds.map((id) => ({
                onsite_id: id,
                invoice_number: (invoiceNumber && invoiceNumber.trim()) ? invoiceNumber.trim() : null,
                received_date: receivedDate,
                sla_target: parseInt(slaTarget),
            })),
        };

        console.log('Sending invoice data:', invoiceData);
        submitInvoiceData(invoiceData, $form);
    });

    // Function to submit data to server
    function submitInvoiceData(data, $form) {
        const $submitBtn = $invoiceForm.find('button[type="submit"]');
        const originalText = $submitBtn.html();

        $submitBtn.prop("disabled", true).html(
            '<i class="mgc_loader_2_line animate-spin"></i> Menyimpan...'
        );

        $.ajax({
            url: route("dari-vendor.store-multiple"),
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                console.log('Success response:', response);
                showToast(response.message || "Invoice berhasil disimpan!", "success", 2000);

                // Reset form
                $form.trigger("reset");
                $("input.row-checkbox").prop("checked", false);
                updateSelectAllCheckbox();
                $invoiceFormContainer.addClass("hidden");

                // Redirect
                setTimeout(() => {
                    window.location.href = route("dari-vendor.index");
                }, 1500);
            },
            error: function (xhr) {
                console.error('Error response:', xhr);
                let message = "Gagal menyimpan invoice";
                
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    } else if (xhr.responseJSON.errors) {
                        const errors = Object.values(xhr.responseJSON.errors).flat();
                        message = errors.join(', ');
                    }
                }
                
                showError(message, "Error!");
            },
            complete: function () {
                $submitBtn.prop("disabled", false).html(originalText);
            },
        });
    }
}

/**
 * Update display of invoice form berdasarkan selected store
 */
function updateFormDisplay() {
    const $invoiceFormContainer = $("#invoice-form-container");
    if (selectedOnsiteIds.size === 0) {
        $invoiceFormContainer.addClass("hidden");
        return;
    }
    $invoiceFormContainer.removeClass("hidden");
    generateFormFromStore();
}

/**
 * Generate form berdasarkan selected items
 */
function generateFormFromStore() {
    const $formItemsContainer = $("#form-items-container");
    const $selectedItemsSummary = $("#selected-items-summary");

    // Clear existing content
    $formItemsContainer.empty();
    $selectedItemsSummary.empty();

    let totalAmount = 0;

    // Add summary items with pricing details
    Array.from(selectedItemsData.values()).forEach((item) => {
        const poNumber = item.po_number;
        const prNumber = item.pr_number;
        const supplier = item.supplier;
        const itemDesc = item.item_desc;
        const onsiteDate = item.onsite_date || "-";
        const unitPrice = parseFloat(item.unit_price) || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const amount = parseFloat(item.amount) || 0;

        totalAmount += amount;

        const summaryHtml = `
            <div class="p-3 bg-white dark:bg-slate-800 rounded border border-blue-100 dark:border-blue-800">
                <div class="text-sm space-y-1">
                    <div>
                        <strong class="text-primary">${poNumber}</strong> - ${supplier}
                        <br>
                        <span class="text-slate-600 dark:text-slate-400">${itemDesc}</span>
                    </div>
                    <div class="flex justify-between gap-4 pt-2 border-t border-blue-100 dark:border-blue-700">
                        <span class="text-slate-600 dark:text-slate-400">Onsite: <strong>${onsiteDate}</strong></span>
                        <span class="text-slate-600 dark:text-slate-400">Unit Price: <strong>Rp ${unitPrice.toLocaleString('id-ID', {maximumFractionDigits: 0})}</strong></span>
                        <span class="text-slate-600 dark:text-slate-400">Qty: <strong>${quantity.toLocaleString('id-ID', {maximumFractionDigits: 0})}</strong></span>
                        <span class="text-primary font-semibold">Amount: <strong>Rp ${amount.toLocaleString('id-ID', {maximumFractionDigits: 0})}</strong></span>
                    </div>
                </div>
            </div>
        `;
        $selectedItemsSummary.append(summaryHtml);
    });

    // Add total amount section
    const totalHtml = `
        <div class="p-4 bg-success/10 dark:bg-success/20 rounded border border-success/30 dark:border-success/40">
            <div class="flex justify-between items-center">
                <span class="font-semibold text-gray-800 dark:text-white">Total Amount:</span>
                <span class="text-lg font-bold text-success">Rp ${totalAmount.toLocaleString('id-ID', {maximumFractionDigits: 0})}</span>
            </div>
        </div>
    `;
    $selectedItemsSummary.append(totalHtml);

    // Generate hidden inputs for all selected items
    let hiddenInputsHtml = "";
    selectedOnsiteIds.forEach((id) => {
        hiddenInputsHtml += `<input type="hidden" name="onsite_ids[]" value="${id}">`;
    });

    // Generate single form with one set of inputs for all selected items
    const formItemHtml = `
        <div class="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-slate-800">
            <div class="mb-6">
                <h5 class="font-semibold text-gray-800 dark:text-white mb-2">Data Invoice</h5>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                    Inputan di bawah ini akan berlaku untuk semua ${selectedOnsiteIds.size} data yang dipilih
                </p>
            </div>

            ${hiddenInputsHtml}

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Invoice Number -->
                <div>
                    <label class="form-label">Nomor Invoice</label>
                    <input type="text" 
                        name="invoice_number" 
                        class="form-input invoice-number-input" 
                        placeholder="Masukkan nomor invoice">
                </div>

                <!-- Tanggal Diterima -->
                <div>
                    <label class="form-label">Tanggal Diterima <span class="text-red-500">*</span></label>
                    <input type="text" 
                        name="received_date" 
                        class="form-input date-picker-field" 
                        placeholder="Pilih tanggal"
                        required>
                </div>

                <!-- SLA Target -->
                <div>
                    <label class="form-label">Target SLA (Hari) <span class="text-red-500">*</span></label>
                    <input type="number" 
                        name="sla_target" 
                        class="form-input sla-target-input" 
                        value=""
                        min="1"
                        max="365"
                        placeholder="Jumlah hari"
                        required>
                </div>
            </div>
        </div>
    `;

    $formItemsContainer.append(formItemHtml);

    // Initialize date picker
    const $dateInput = $formItemsContainer.find(".date-picker-field");
    flatpickr($dateInput[0], {
        dateFormat: "Y-m-d",
        locale: "id",
        altInput: true,
        altFormat: "d-M-Y",
        allowInput: true,
    });
}

/**
 * Restore checkbox states on current view based on store
 */
function restoreCheckboxStates() {
    const $rowCheckboxes = $("input.row-checkbox");
    $rowCheckboxes.each(function () {
        const $cb = $(this);
        const id = $cb.data("onsite-id");
        if (selectedOnsiteIds.has(id)) {
            $cb.prop("checked", true);
        }
    });
    // Update select-all indicator after restoration
    const $selectAllCheckbox = $("#select-all-checkbox");
    if ($selectAllCheckbox.length) {
        const totalCheckboxes = $rowCheckboxes.length;
        const checkedCheckboxes = $rowCheckboxes.filter(":checked").length;
        if (checkedCheckboxes === 0) {
            $selectAllCheckbox.prop("checked", false).prop("indeterminate", false);
        } else if (checkedCheckboxes === totalCheckboxes) {
            $selectAllCheckbox.prop("checked", true).prop("indeterminate", false);
        } else {
            $selectAllCheckbox.prop("checked", false).prop("indeterminate", true);
        }
    }
}

/**
 * Update selection store for a checkbox
 */
function updateSelectedStoreWithCheckbox($checkbox, isChecked) {
    const id = $checkbox.data("onsite-id");
    if (isChecked) {
        selectedOnsiteIds.add(id);
        selectedItemsData.set(id, {
            po_number: $checkbox.data("po-number"),
            pr_number: $checkbox.data("pr-number"),
            supplier: $checkbox.data("supplier"),
            item_desc: $checkbox.data("item-desc"),
            unit_price: $checkbox.data("unit-price"),
            quantity: $checkbox.data("quantity"),
            amount: $checkbox.data("amount"),
            onsite_date: $checkbox.data("onsite-date"),
        });
    } else {
        selectedOnsiteIds.delete(id);
        selectedItemsData.delete(id);
    }
}

/** * Setup Search/Filter untuk tabel PO Onsite
 */
function setupSearchFilter() {
    const $searchInput = $("#search-po-table");
    const $tableBody = $("table tbody");
    const $allRows = $tableBody.find("tr[data-onsite-id]");
    const $emptyRow = $tableBody.find("tr:not([data-onsite-id])");

    $searchInput.on("keyup", function () {
        const searchTerm = $(this).val().toLowerCase().trim();

        if (searchTerm === "") {
            // Show all data rows if search is empty
            $allRows.show();
            $emptyRow.hide();
            return;
        }

        let visibleCount = 0;

        $allRows.each(function () {
            const $row = $(this);
            
            // Get data from checkbox attributes - more reliable method
            const $checkbox = $row.find(".row-checkbox");
            const poNumber = ($checkbox.data("po-number") || "").toString().toLowerCase();
            const prNumber = ($checkbox.data("pr-number") || "").toString().toLowerCase();

            // Combine searchable text from PO and PR number only
            const rowText = `${poNumber} ${prNumber}`;

            // Show/hide row based on search
            if (rowText.includes(searchTerm)) {
                $row.show();
                visibleCount++;
            } else {
                $row.hide();
            }
        });

        // Show empty state if no results
        if (visibleCount === 0) {
            $emptyRow.show();
        } else {
            $emptyRow.hide();
        }
    });

    // Clear search on ESC key
    $searchInput.on("keydown", function (e) {
        if (e.key === "Escape") {
            $searchInput.val("").trigger("keyup");
            $searchInput.blur();
        }
    });
}

export default initInvoiceCreate;
