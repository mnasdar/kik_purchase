import flatpickr from "flatpickr";
import { Indonesian } from "flatpickr/dist/l10n/id.js";
import {
    confirmDelete,
    showToast,
    confirmAction,
} from "../../../core/notification.js";

// State Management
let availableInvoices = [];
let filteredInvoices = [];
let selectedInvoiceIds = new Set();
let currentPage = 1;
const itemsPerPage = 10;

/**
 * Initialize the create pengajuan form
 */
document.addEventListener("DOMContentLoaded", function () {
    initializeFlatpickr();
    initializeModalEventHandlers();
    initializeFormEventHandlers();
    initializeTableEventHandlers();
});

/**
 * Initialize flatpickr for submission date
 */
function initializeFlatpickr() {
    const submitDateInput = document.querySelector(".flatpickr-submit-date");
    if (!submitDateInput) return;

    flatpickr(submitDateInput, {
        locale: Indonesian,
        dateFormat: "d M Y",
        altInput: true,
        altFormat: "d M Y",
        allowInput: true,
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                recalculateAllSLA();
            }
        },
    });
}

/**
 * Initialize modal event handlers
 */
function initializeModalEventHandlers() {
    const btnPickInvoice = document.getElementById("btn-pick-invoice");
    const btnCloseModal = document.getElementById("btn-close-invoice-modal");
    const searchInput = document.getElementById("invoice-search-input");
    const btnPrev = document.getElementById("btn-invoice-prev");
    const btnNext = document.getElementById("btn-invoice-next");
    const btnSaveSelection = document.getElementById(
        "btn-save-invoice-selection"
    );
    const selectAllCheckbox = document.getElementById("invoice-select-all");

    if (btnPickInvoice) {
        btnPickInvoice.addEventListener("click", openInvoiceModal);
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener("click", closeInvoiceModal);
    }

    if (searchInput) {
        searchInput.addEventListener("input", handleInvoiceSearch);
    }

    if (btnPrev) {
        btnPrev.addEventListener("click", () => goToPage(currentPage - 1));
    }

    if (btnNext) {
        btnNext.addEventListener("click", () => goToPage(currentPage + 1));
    }

    if (btnSaveSelection) {
        btnSaveSelection.addEventListener("click", handleSaveInvoiceSelection);
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", handleSelectAllInvoices);
    }
}

/**
 * Initialize form event handlers
 */
function initializeFormEventHandlers() {
    const form = document.getElementById("form-create-pengajuan");
    if (form) {
        form.addEventListener("submit", handleFormSubmit);
    }

    const btnDeleteSelected = document.getElementById(
        "btn-delete-selected-items"
    );
    if (btnDeleteSelected) {
        btnDeleteSelected.addEventListener("click", handleDeleteSelectedItems);
    }
}

/**
 * Initialize table event handlers
 */
function initializeTableEventHandlers() {
    const selectAll = document.getElementById("item-select-all");
    if (selectAll) {
        selectAll.addEventListener("change", handleSelectAllItems);
    }
}

/**
 * Open invoice picker modal
 */
async function openInvoiceModal() {
    const modal = document.getElementById("modal-pick-invoice");
    if (!modal) return;

    // Show modal
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Load invoices
    try {
        await fetchAvailableInvoices();
        renderInvoiceList();
    } catch (error) {
        console.error("Error loading invoices:", error);
        showToast("Gagal memuat data invoice. Silakan coba lagi.", "error");
    }
}

/**
 * Close invoice picker modal
 */
function closeInvoiceModal() {
    const modal = document.getElementById("modal-pick-invoice");
    if (!modal) return;

    modal.classList.add("hidden");
    document.body.style.overflow = "";

    // Reset search
    const searchInput = document.getElementById("invoice-search-input");
    if (searchInput) {
        searchInput.value = "";
    }

    // Reset select all checkbox
    const selectAllCheckbox = document.getElementById("invoice-select-all");
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }

    filteredInvoices = [...availableInvoices];
    currentPage = 1;
}

/**
 * Fetch available invoices from server
 */
async function fetchAvailableInvoices() {
    try {
        const response = await fetch("/invoice/pengajuan/get-invoices");
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        availableInvoices = data.data || [];
        filteredInvoices = [...availableInvoices];
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
}

/**
 * Handle invoice search input
 */
function handleInvoiceSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (!searchTerm) {
        filteredInvoices = [...availableInvoices];
    } else {
        filteredInvoices = availableInvoices.filter((invoice) => {
            return (
                invoice.invoice_number?.toLowerCase().includes(searchTerm) ||
                invoice.purchase_order?.po_number
                    ?.toLowerCase()
                    .includes(searchTerm) ||
                invoice.purchase_order?.purchase_request?.pr_number
                    ?.toLowerCase()
                    .includes(searchTerm) ||
                invoice.item_description?.toLowerCase().includes(searchTerm)
            );
        });
    }

    currentPage = 1;
    renderInvoiceList();
}

/**
 * Render invoice list in modal
 */
function renderInvoiceList() {
    const tbody = document.getElementById("invoice-list-body");
    if (!tbody) return;

    const totalItems = filteredInvoices.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageItems = filteredInvoices.slice(startIndex, endIndex);

    // Update counters
    document.getElementById("invoice-count").textContent = totalItems;
    document.getElementById("invoice-total").textContent =
        availableInvoices.length;
    document.getElementById("invoice-current-page").textContent = currentPage;
    document.getElementById("invoice-total-pages").textContent =
        totalPages || 1;
    document.getElementById("invoice-per-page").textContent = itemsPerPage;

    // Update pagination buttons
    const btnPrev = document.getElementById("btn-invoice-prev");
    const btnNext = document.getElementById("btn-invoice-next");
    if (btnPrev) btnPrev.disabled = currentPage <= 1;
    if (btnNext) btnNext.disabled = currentPage >= totalPages;

    // Render rows
    tbody.innerHTML = "";

    if (pageItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="mgc_inbox_line text-3xl mb-2"></i>
                    <p class="text-sm">Tidak ada invoice yang tersedia</p>
                </td>
            </tr>
        `;
        return;
    }

    pageItems.forEach((invoice) => {
        const row = document.createElement("tr");
        row.className = "border-b hover:bg-gray-50 dark:hover:bg-slate-700/50";

        const isAlreadySelected = selectedInvoiceIds.has(invoice.id);
        const unitPrice = parseFloat(invoice.unit_price) || 0;
        const qty = parseFloat(invoice.qty) || 0;
        const amount = unitPrice * qty;

        row.innerHTML = `
            <td class="px-3 py-2 text-center">
                <input type="checkbox" class="form-checkbox rounded text-primary invoice-checkbox" data-invoice-id="${
                    invoice.id
                }" ${isAlreadySelected ? "checked" : ""}>
            </td>
            <td class="px-3 py-2">
                <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">${
                    invoice.invoice_number || "-"
                }</span>
            </td>
            <td class="px-3 py-2">
                <span class="text-sm">${
                    invoice.purchase_order?.po_number || "-"
                }</span>
            </td>
            <td class="px-3 py-2">
                <span class="text-sm">${
                    invoice.purchase_order?.purchase_request?.pr_number || "-"
                }</span>
            </td>
            <td class="px-3 py-2">
                <span class="text-sm">${invoice.item_description || "-"}</span>
            </td>
            <td class="px-3 py-2 text-right">
                <span class="text-sm">${formatCurrency(unitPrice)}</span>
            </td>
            <td class="px-3 py-2 text-center">
                <span class="text-sm">${qty}</span>
            </td>
            <td class="px-3 py-2 text-right">
                <span class="text-sm font-semibold">${formatCurrency(
                    amount
                )}</span>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Attach event listeners to checkboxes
    tbody.querySelectorAll(".invoice-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", updateModalCheckboxCount);
    });
}

/**
 * Update modal checkbox count display
 */
function updateModalCheckboxCount() {
    const checkedBoxes = document.querySelectorAll(
        "#invoice-list-body .invoice-checkbox:checked"
    );
    const btnSaveSelection = document.getElementById(
        "btn-save-invoice-selection"
    );
    const selectAllCheckbox = document.getElementById("invoice-select-all");

    // Update save button
    if (btnSaveSelection) {
        const count = checkedBoxes.length;
        btnSaveSelection.innerHTML = `
            <i class="mgc_check_line me-2"></i>
            Simpan Pilihan${count > 0 ? ` (${count})` : ""}
        `;
        btnSaveSelection.disabled = count === 0;
    }

    // Update select all checkbox state
    if (selectAllCheckbox) {
        const totalCheckboxes = document.querySelectorAll(
            "#invoice-list-body .invoice-checkbox"
        ).length;
        if (totalCheckboxes > 0) {
            selectAllCheckbox.checked = checkedBoxes.length === totalCheckboxes;
        }
    }
}

/**
 * Handle select all checkboxes in modal
 */
function handleSelectAllInvoices(event) {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll(
        "#invoice-list-body .invoice-checkbox"
    );

    checkboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
    });

    updateModalCheckboxCount();
}

/**
 * Handle save invoice selection from modal
 */
function handleSaveInvoiceSelection() {
    const checkedBoxes = document.querySelectorAll(
        "#invoice-list-body .invoice-checkbox:checked"
    );

    if (checkedBoxes.length === 0) {
        showToast("Silakan pilih minimal 1 invoice", "warning");
        return;
    }

    let addedCount = 0;

    // Add all checked invoices to table
    checkedBoxes.forEach((checkbox) => {
        const invoiceId = parseInt(checkbox.dataset.invoiceId);

        // Skip if already added
        if (selectedInvoiceIds.has(invoiceId)) {
            return;
        }

        const invoice = availableInvoices.find((inv) => inv.id === invoiceId);
        if (invoice) {
            selectedInvoiceIds.add(invoiceId);
            addInvoiceToTable(invoice);
            addedCount++;
        }
    });

    // Show success notification
    if (addedCount > 0) {
        showToast(`${addedCount} invoice berhasil ditambahkan`, "success");
    }

    // Close modal
    closeInvoiceModal();
}

/**
 * Add invoice to table
 */
function addInvoiceToTable(invoice) {
    const container = document.getElementById("pengajuan-items-container");
    const template = document.getElementById("pengajuan-item-row-template");

    if (!container || !template) return;

    // Remove empty state if exists
    const emptyRow = container.querySelector("tr:first-child td[colspan]");
    if (emptyRow) {
        container.innerHTML = "";
    }

    // Clone template
    const clone = template.content.cloneNode(true);
    const row = clone.querySelector(".pengajuan-item-row");

    // Set row number
    const rowNumber = container.children.length + 1;
    row.querySelector(".pengajuan-item-number").textContent = rowNumber;

    // Set invoice ID
    row.querySelector(".pengajuan-invoice-id").value = invoice.id;

    // Set invoice data
    row.querySelector(".pengajuan-invoice-number").textContent =
        invoice.invoice_number || "-";
    row.querySelector(".pengajuan-po-number").textContent =
        invoice.purchase_order?.po_number || "-";
    row.querySelector(".pengajuan-pr-number").textContent =
        invoice.purchase_order?.purchase_request?.pr_number || "-";
    row.querySelector(".pengajuan-item-desc").textContent =
        invoice.item_description || "-";

    const unitPrice = parseFloat(invoice.unit_price) || 0;
    const qty = parseFloat(invoice.qty) || 0;
    const amount = unitPrice * qty;

    row.querySelector(".pengajuan-unit-price").textContent =
        formatCurrency(unitPrice);
    row.querySelector(".pengajuan-qty").textContent = qty;
    row.querySelector(".pengajuan-amount").textContent = formatCurrency(amount);

    // Set dates
    const receivedDate = invoice.invoice_received_at
        ? formatDate(invoice.invoice_received_at)
        : "-";
    row.querySelector(".pengajuan-received-date").textContent = receivedDate;
    row.querySelector(
        ".pengajuan-sla-target"
    ).textContent = `${invoice.sla_target} Hari`;

    const slaRealisasiCell = row.querySelector(".pengajuan-sla-realisasi");
    const submitDateInput = document.querySelector(".flatpickr-submit-date");
    if (
        slaRealisasiCell &&
        submitDateInput &&
        submitDateInput._flatpickr &&
        invoice.invoice_received_at
    ) {
        const submitDate = submitDateInput._flatpickr.selectedDates[0];
        if (submitDate) {
            const slaDays = calculateBusinessDays(
                invoice.invoice_received_at,
                submitDate
            );
            slaRealisasiCell.textContent =
                slaDays === "-" ? "-" : `${slaDays} Hari`;
        } else {
            slaRealisasiCell.textContent = "-";
        }
    } else if (slaRealisasiCell) {
        slaRealisasiCell.textContent = "-";
    }

    // Store full invoice data in row
    row.dataset.invoiceData = JSON.stringify(invoice);

    // Attach remove handler
    const btnRemove = row.querySelector(".pengajuan-btn-remove-item");
    btnRemove.addEventListener("click", () =>
        handleRemoveInvoiceFromTable(invoice.id, row)
    );

    // Attach checkbox handler
    const checkbox = row.querySelector(".item-checkbox");
    checkbox.addEventListener("change", updateDeleteSelectedButton);

    container.appendChild(row);

    // Update row numbers
    updateRowNumbers();
}

/**
 * Handle remove invoice from table
 */
async function handleRemoveInvoiceFromTable(invoiceId, row) {
    // Get invoice number for confirmation message
    const invoiceNumber =
        row.querySelector(".pengajuan-invoice-number")?.textContent ||
        "invoice ini";

    // Show confirmation dialog
    const confirmed = await confirmDelete(
        `invoice <strong>${invoiceNumber}</strong>`
    );

    if (!confirmed) {
        return;
    }

    // Remove from selected set
    selectedInvoiceIds.delete(invoiceId);

    // Remove row
    row.remove();

    // Show success notification
    showToast(
        `Invoice ${invoiceNumber} berhasil dihapus dari daftar`,
        "success"
    );

    // Update row numbers
    updateRowNumbers();

    // Check if table is empty
    const container = document.getElementById("pengajuan-items-container");
    if (container && container.children.length === 0) {
        container.innerHTML = `
            <tr class="text-center text-gray-500">
                <td colspan="13" class="border px-4 py-8">
                    <div class="flex flex-col items-center gap-2">
                        <i class="mgc_inbox_line text-4xl text-gray-400"></i>
                        <p class="text-sm">Belum ada invoice yang dipilih</p>
                        <p class="text-xs text-gray-400">Klik tombol "Pilih Invoice" untuk memulai</p>
                    </div>
                </td>
            </tr>
        `;
    }

    // Update delete button
    updateDeleteSelectedButton();

    // Update modal if open
    const modal = document.getElementById("modal-pick-invoice");
    if (modal && !modal.classList.contains("hidden")) {
        renderInvoiceList();
    }
}

/**
 * Update row numbers
 */
function updateRowNumbers() {
    const container = document.getElementById("pengajuan-items-container");
    if (!container) return;

    const rows = container.querySelectorAll(".pengajuan-item-row");
    rows.forEach((row, index) => {
        const numberCell = row.querySelector(".pengajuan-item-number");
        if (numberCell) {
            numberCell.textContent = index + 1;
        }
    });
}

/**
 * Handle select all items
 */
function handleSelectAllItems(event) {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll(".item-checkbox");

    checkboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
    });

    updateDeleteSelectedButton();
}

/**
 * Update delete selected button visibility
 */
function updateDeleteSelectedButton() {
    const checkboxes = document.querySelectorAll(".item-checkbox:checked");
    const btn = document.getElementById("btn-delete-selected-items");
    const countSpan = document.getElementById("selected-items-count");

    if (btn && countSpan) {
        const count = checkboxes.length;
        if (count > 0) {
            btn.classList.remove("hidden");
            countSpan.textContent = count;
        } else {
            btn.classList.add("hidden");
            countSpan.textContent = "0";
        }
    }

    // Update select all checkbox
    const selectAll = document.getElementById("item-select-all");
    if (selectAll) {
        const allCheckboxes = document.querySelectorAll(".item-checkbox");
        const allChecked =
            allCheckboxes.length > 0 &&
            allCheckboxes.length === checkboxes.length;
        selectAll.checked = allChecked;
    }
}

/**
 * Handle delete selected items
 */
async function handleDeleteSelectedItems() {
    const checkboxes = document.querySelectorAll(".item-checkbox:checked");

    if (checkboxes.length === 0) return;

    // Show confirmation dialog
    const confirmed = await confirmAction(
        `Anda akan menghapus ${checkboxes.length} invoice dari daftar`,
        "Hapus Invoice Terpilih?"
    );

    if (!confirmed) {
        return;
    }

    let deletedCount = 0;

    checkboxes.forEach((checkbox) => {
        const row = checkbox.closest(".pengajuan-item-row");
        if (row) {
            const invoiceId = parseInt(
                row.querySelector(".pengajuan-invoice-id").value
            );

            // Remove from selected set
            selectedInvoiceIds.delete(invoiceId);

            // Remove row
            row.remove();
            deletedCount++;
        }
    });

    // Show success notification
    showToast(
        `${deletedCount} invoice berhasil dihapus dari daftar`,
        "success"
    );

    // Update row numbers
    updateRowNumbers();

    // Check if table is empty
    const container = document.getElementById("pengajuan-items-container");
    if (container && container.children.length === 0) {
        container.innerHTML = `
            <tr class="text-center text-gray-500">
                <td colspan="13" class="border px-4 py-8">
                    <div class="flex flex-col items-center gap-2">
                        <i class="mgc_inbox_line text-4xl text-gray-400"></i>
                        <p class="text-sm">Belum ada invoice yang dipilih</p>
                        <p class="text-xs text-gray-400">Klik tombol "Pilih Invoice" untuk memulai</p>
                    </div>
                </td>
            </tr>
        `;
    }

    // Update delete button
    updateDeleteSelectedButton();

    // Update modal if open
    const modal = document.getElementById("modal-pick-invoice");
    if (modal && !modal.classList.contains("hidden")) {
        renderInvoiceList();
    }
}

/**
 * Recalculate all SLA when submit date changes
 */
function recalculateAllSLA() {
    const container = document.getElementById("pengajuan-items-container");
    if (!container) return;

    const submitDateInput = document.querySelector(".flatpickr-submit-date");
    if (!submitDateInput || !submitDateInput._flatpickr) return;

    const submitDate = submitDateInput._flatpickr.selectedDates[0];
    if (!submitDate) return;

    const rows = container.querySelectorAll(".pengajuan-item-row");
    rows.forEach((row) => {
        const invoiceData = JSON.parse(row.dataset.invoiceData || "{}");
        const slaTargetCell = row.querySelector(".pengajuan-sla-target");
        if (slaTargetCell) {
            const slaTarget = invoiceData.sla_target || 5;
            slaTargetCell.textContent = `${slaTarget} Hari`;
        }

        const slaRealisasiCell = row.querySelector(".pengajuan-sla-realisasi");
        if (slaRealisasiCell) {
            if (invoiceData.invoice_received_at) {
                const slaDays = calculateBusinessDays(
                    invoiceData.invoice_received_at,
                    submitDate
                );
                slaRealisasiCell.textContent =
                    slaDays === "-" ? "-" : `${slaDays} Hari`;
            } else {
                slaRealisasiCell.textContent = "-";
            }
        }
    });
}

/**
 * Get SLA target (days) from invoice data/meta/config
 */
function getSlaTarget() {
    // Try per-invoice attribute if present via row dataset when needed
    // Fallback to meta tag injected by Blade; default to 7 if not set
    const metaEl = document.querySelector(
        'meta[name="sla_invoice_to_finance_target"]'
    );
    const val = metaEl?.getAttribute("content");
    const num = parseInt(val, 10);
    return Number.isFinite(num) && num > 0 ? num : 7;
}

/**
 * Calculate SLA realization in business days (Mon-Fri)
 * Excludes the received day, includes the submit day if weekday
 */
function calculateBusinessDays(receivedDateStr, submitDate) {
    try {
        const start = new Date(receivedDateStr);
        const end = new Date(submitDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";
        // Normalize to midnight to avoid DST/timezone issues
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        if (end < start) return "-";

        // Start counting from the next day after received
        const cursor = new Date(start);
        cursor.setDate(cursor.getDate() + 1);
        let count = 0;
        while (cursor <= end) {
            const day = cursor.getDay(); // 0=Sun, 6=Sat
            if (day !== 0 && day !== 6) {
                count += 1;
            }
            cursor.setDate(cursor.getDate() + 1);
        }
        return count;
    } catch (error) {
        console.error("Error calculating business-day SLA:", error);
        return "-";
    }
}

/**
 * Format Date object to YYYY-MM-DD
 */
function formatDateToYmd(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Handle form submit
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const container = document.getElementById("pengajuan-items-container");
    const submitDateInput = document.querySelector(".flatpickr-submit-date");
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalSubmitContent = submitButton ? submitButton.innerHTML : "";

    // Resolve submit date as Date object
    let submitDateObj = null;
    if (
        submitDateInput &&
        submitDateInput._flatpickr &&
        submitDateInput._flatpickr.selectedDates.length > 0
    ) {
        submitDateObj = submitDateInput._flatpickr.selectedDates[0];
    } else if (submitDateInput?.value) {
        const parsed = new Date(submitDateInput.value);
        if (!isNaN(parsed.getTime())) {
            submitDateObj = parsed;
        }
    }

    // Validation
    if (!submitDateInput || !submitDateObj) {
        showToast("Tanggal pengajuan harus diisi", "warning");
        submitDateInput.focus();
        return false;
    }

    if (
        !container ||
        container.querySelectorAll(".pengajuan-item-row").length === 0
    ) {
        showToast("Belum ada invoice yang dipilih", "warning");
        return false;
    }

    // Confirm submission
    const itemCount = container.querySelectorAll(".pengajuan-item-row").length;
    const confirmed = await confirmAction(
        `Anda akan mengajukan ${itemCount} invoice ke finance`,
        "Ajukan Invoice?"
    );

    if (!confirmed) {
        return false;
    }

    // Submit via fetch to handle JSON response and prevent blank page
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML =
            '<span class="loading loading-spinner loading-sm me-2"></span>Menyimpan...';
    }

    try {
        const formData = new FormData(form);

        // Normalize date to YYYY-MM-DD for backend validation
        if (submitDateObj) {
            formData.set(
                "invoice_submitted_at",
                formatDateToYmd(submitDateObj)
            );
        }

        const response = await fetch(form.action, {
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
            body: formData,
        });
        let data = null;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error("Failed to parse response JSON:", parseError);
        }

        if (!response.ok || (data && data.success === false)) {
            // Handle validation errors (422) or server errors
            const message =
                extractErrorMessage(data) || "Gagal menyimpan pengajuan";
            showToast(message, "error");
            return false;
        }

        showToast(data?.message || "Pengajuan berhasil disimpan", "success");

        // Redirect to index after short delay
        setTimeout(() => {
            window.location.href = "/invoice/pengajuan";
        }, 600);
    } catch (error) {
        console.error("Error submitting pengajuan:", error);
        showToast(
            "Terjadi kesalahan saat menyimpan. Silakan coba lagi.",
            "error"
        );
        return false;
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalSubmitContent;
        }
    }
}

/**
 * Format currency
 */
function formatCurrency(value) {
    // Format number with thousand separators only (no currency prefix)
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format date to dd-MMM-yy
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        const month = monthNames[date.getMonth()];
        const year = String(date.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
    } catch (error) {
        return "-";
    }
}

/**
 * Extract a readable error message from validation/server response
 */
function extractErrorMessage(data) {
    if (!data) return null;
    if (data.message) return data.message;

    // Laravel validation errors structure: { errors: { field: ['msg'] } }
    if (data.errors && typeof data.errors === "object") {
        const firstKey = Object.keys(data.errors)[0];
        if (
            firstKey &&
            Array.isArray(data.errors[firstKey]) &&
            data.errors[firstKey].length > 0
        ) {
            return data.errors[firstKey][0];
        }
    }

    return null;
}
