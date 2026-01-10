/**
 * Modul Pembayaran - Read & List
 * Render datatable pembayaran, refresh data, bulk delete functionality
 * Menggunakan Grid.js + jQuery seperti PO module
 */
import $ from "jquery";
import { Grid, h } from "gridjs";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showToast, showError } from "../../../core/notification";

let gridInstance = null;
let pembayaranData = [];
let selectedIds = [];

function getTableColumns() {
    return [
        {
            id: "checkbox",
            name: h("div", {
                innerHTML: '<input type="checkbox" id="headerCheck" class="form-checkbox rounded text-primary">',
            }),
            width: "50px",
            sort: false,
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        { id: "number", name: "#", width: "50px" },
        { id: "payment_number", name: "Payment Number", width: "130px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "po_number", name: "No PO", width: "150px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-primary">${cell}</span>` }) },
        { id: "item_desc", name: "Deskripsi Item", width: "200px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "unit_price", name: "Harga Unit", width: "120px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-slate-700 dark:text-slate-300">${cell}</span>` }) },
        { id: "qty", name: "Qty", width: "70px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-center block">${cell}</span>` }) },
        { id: "amount", name: "Amount", width: "130px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-green-600 dark:text-green-400">${cell}</span>` }) },
        { id: "invoice_submit", name: "Tgl Invoice", width: "110px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "payment_date", name: "Tgl Pembayaran", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "sla_payment", name: "SLA", width: "80px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "created_by", name: "Dibuat Oleh", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
    ];
}

function fetchTableData(showNotification = false) {
    $.ajax({
        url: route("pembayaran.data"),
        method: "GET",
        beforeSend: function () {
            if (showNotification) {
                showToast("Memuat data...", "info", 1000);
            }
        },
        success: function (response) {
            const data = Array.isArray(response) ? response : (response?.data ?? []);
            const stats = Array.isArray(response) ? null : (response?.stats ?? null);

            pembayaranData = data;
            const tableData = data.map((item) => {
                return [
                    `<input type="checkbox" class="form-checkbox rounded text-primary" value="${item.id}">`,
                    item.number,
                    item.payment_number,
                    `<button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 hover:shadow-md transition-all duration-200 pembayaran-po-click" data-payment-id="${item.id}"><span>${item.po_number}</span></button>`,
                    item.item_desc,
                    item.unit_price,
                    item.qty,
                    item.amount,
                    item.invoice_submit,
                    item.payment_date,
                    item.sla_payment,
                    item.created_by,
                ];
            });

            if (gridInstance) {
                gridInstance.updateConfig({ data: tableData }).forceRender();
            } else {
                gridInstance = new Grid({
                    columns: getTableColumns(),
                    data: tableData,
                    sort: true,
                    pagination: { enabled: true, limit: 10 },
                    search: true,
                    className: {
                        table: "table-auto w-full",
                        thead: "bg-slate-100 dark:bg-slate-800",
                        th: "px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300",
                        td: "px-4 py-3 text-sm text-slate-900 dark:text-slate-100",
                    },
                }).render(document.getElementById("table-pembayaran"));
            }

            updateStats(stats, data);
            $("#headerCheck").prop("checked", false);
            $("#btn-delete-selected").addClass("hidden");
            $("#delete-count").text(0);

            setTimeout(() => {
                tippy("[data-tippy-content]", { arrow: true, placement: "top" });
                attachEventListeners();
            }, 100);

            if (showNotification) {
                showToast("Data berhasil dimuat!", "success", 1500);
            }
        },
        error: function () {
            showError("Gagal memuat data pembayaran", "Error!");
        },
    });
}

/**
 * Update statistics cards
 */
function updateStats(stats, data) {
    const total = stats?.total ?? data.length;
    const paid = stats?.paid ?? data.filter(item => item.payment_date && item.payment_date !== '-').length;
    const pending = stats?.pending ?? Math.max(total - paid, 0);
    const recent = stats?.recent ?? calculateRecentFromData(data);

    $("#stat-total").text(total ?? 0);
    $("#stat-paid").text(paid ?? 0);
    $("#stat-pending").text(pending ?? 0);
    $("#stat-recent").text(recent ?? 0);

    // Update delete button count
    updateDeleteCount();
}

/**
 * Fallback recent calculation from client data
 */
function calculateRecentFromData(data) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    return data.filter(item => {
        if (!item.payment_date || item.payment_date === '-') return false;

        // Parse payment_date format (assuming dd-MMM-yy like "25-Dec-25")
        const parts = item.payment_date.split('-');
        if (parts.length !== 3) return false;

        const day = parseInt(parts[0]);
        const monthStr = parts[1];
        const year = parseInt(parts[2]);

        const monthMap = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        const month = monthMap[monthStr];
        if (month === undefined) return false;

        // Assume year is in 2000s for 2-digit years
        const fullYear = year > 50 ? 1900 + year : 2000 + year;
        const paymentDate = new Date(fullYear, month, day);

        return paymentDate >= thirtyDaysAgo && paymentDate <= today;
    }).length;
}

/**
 * Attach event listeners ke checkbox dan aksi buttons
 */
function attachEventListeners() {
    // Header checkbox
    $(document).off("change", "#headerCheck").on("change", "#headerCheck", function () {
        const isChecked = $(this).is(":checked");
        $(".form-checkbox").not("#headerCheck").prop("checked", isChecked).trigger("change");
    });

    // Row checkboxes
    $(document).off("change", ".form-checkbox").on("change", ".form-checkbox", function () {
        if ($(this).is("#headerCheck")) return;
        updateSelectedIds();
        
        // Update header checkbox state
        const total = $(".form-checkbox").not("#headerCheck").length;
        const checked = $(".form-checkbox:checked").not("#headerCheck").length;
        $("#headerCheck").prop("checked", total > 0 && total === checked);
    });

    // PO detail button
    $(document).off("click", ".pembayaran-po-click").on("click", ".pembayaran-po-click", function (e) {
        e.preventDefault();
        const paymentId = $(this).data("payment-id");
        if (paymentId) openPembayaranDetailModal(paymentId);
    });

    // Modal close handlers
    $(document).off("click", "#detailPembayaranModalClose, #detailPembayaranModalBackdrop")
        .on("click", "#detailPembayaranModalClose, #detailPembayaranModalBackdrop", function () {
            closePembayaranDetailModal();
        });

    // Detail button - will be added later with action column
    $(document).off("click", ".btn-detail-pembayaran").on("click", ".btn-detail-pembayaran", function () {
        const id = $(this).data("id");
        openDetailModal(id);
    });

    // Delete button - will be added later with action column
    $(document).off("click", ".btn-delete-pembayaran").on("click", ".btn-delete-pembayaran", function () {
        const id = $(this).data("id");
        const number = $(this).data("number");
        showDeleteModal([id], `Apakah Anda yakin ingin menghapus pembayaran "${number}"?`);
    });
}

/**
 * Update selected IDs array
 */
function updateSelectedIds() {
    selectedIds = [];
    $(".form-checkbox:checked").not("#headerCheck").each(function () {
        selectedIds.push($(this).val());
    });
    updateDeleteCount();
}

/**
 * Update delete button count and visibility
 */
function updateDeleteCount() {
    const hasSelected = selectedIds.length > 0;
    $("#delete-count").text(selectedIds.length);
    if (hasSelected) {
        $("#btn-delete-selected").removeClass("hidden").prop("disabled", false);
    } else {
        $("#btn-delete-selected").addClass("hidden").prop("disabled", true);
    }
}

/**
 * Update delete button visibility
 */
function updateDeleteButton() {
    updateDeleteCount();
}

/**
 * Show delete confirmation modal
 */
function showDeleteModal(ids, message = "Apakah Anda yakin ingin menghapus data ini?") {
    selectedIds = ids;
    $("#deleteMessage").text(message);

    const modal = $("#deleteModal");
    const backdrop = $("#deleteModalBackdrop");
    const content = $("#deleteModalContent");

    modal.removeClass("hidden").css("opacity", "1");
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ transform: "scale(1)", opacity: "1" });
    });
}

/**
 * Hide delete modal
 */
function hideDeleteModal() {
    const backdrop = $("#deleteModalBackdrop");
    const content = $("#deleteModalContent");
    backdrop.css("opacity", "0");
    content.css({ transform: "scale(0.95)", opacity: "0" });
    setTimeout(() => {
        $("#deleteModal").addClass("hidden").css("opacity", "0");
    }, 300);
}

/**
 * Open detail modal
 */
function openDetailModal(id) {
    const payment = pembayaranData.find(p => p.id == id);
    if (!payment) return;

    $("#detailPaymentNumber").text(payment.payment_number || '-');
    $("#detailPaymentDate").text(payment.payment_date || '-');
    $("#detailPaymentSLAPayment").text(payment.sla_payment || '-');
    $("#detailInvoiceNumber").text(payment.invoice_number || '-');
    $("#detailPONumber").text(payment.po_number || '-');
    $("#detailPRNumber").text(payment.pr_number || '-');
    $("#detailCreatedBy").text(payment.created_by || '-');

    const modal = $("#detailPembayaranModal");
    const backdrop = $("#detailPembayaranModalBackdrop");
    const content = $("#detailPembayaranModalContent");

    modal.removeClass("hidden").css("opacity", "1");
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ transform: "scale(1)", opacity: "1" });
    });
}

/**
 * Hide detail modal
 */
function hideDetailModal() {
    const backdrop = $("#detailPembayaranModalBackdrop");
    const content = $("#detailPembayaranModalContent");
    backdrop.css("opacity", "0");
    content.css({ transform: "scale(0.95)", opacity: "0" });
    setTimeout(() => {
        $("#detailPembayaranModal").addClass("hidden").css("opacity", "0");
    }, 300);
}

/**
 * Initialize pembayaran table
 */
export function initPembayaranTable() {
    fetchTableData(false);
}

/**
 * Initialize refresh button
 */
export function initPembayaranRefresh() {
    $(document).off("click", "#btn-refresh").on("click", "#btn-refresh", function () {
        fetchTableData(true);
    });
}

/**
 * Initialize delete functionality
 */
export function initPembayaranDelete() {
    // Bulk delete button
    $(document).off("click", "#btn-delete-selected").on("click", "#btn-delete-selected", function () {
        if (selectedIds.length === 0) {
            showToast("Pilih minimal 1 pembayaran untuk dihapus", "warning", 2000);
            return;
        }
        showDeleteModal(selectedIds, `Apakah Anda yakin ingin menghapus ${selectedIds.length} pembayaran?`);
    });

    // Confirm delete
    $(document).off("click", "#deleteModalConfirm").on("click", "#deleteModalConfirm", async function () {
        const btn = $(this);
        const original = btn.text();
        btn.prop("disabled", true).text("Menghapus...");

        try {
            await $.ajax({
                url: route("pembayaran.bulk-destroy"),
                method: "DELETE",
                data: { ids: selectedIds },
                headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
            });
            hideDeleteModal();
            showToast("Pembayaran berhasil dihapus!", "success", 2000);
            selectedIds = [];
            updateDeleteButton();
            setTimeout(() => fetchTableData(false), 500);
        } catch (error) {
            showError(error?.responseJSON?.message || "Gagal menghapus pembayaran", "Gagal!");
        } finally {
            btn.prop("disabled", false).text(original);
        }
    });

    // Cancel dan backdrop
    $(document).off("click", "#deleteModalCancel, #deleteModalClose").on("click", "#deleteModalCancel, #deleteModalClose", hideDeleteModal);
    $(document).off("click", "#deleteModal").on("click", "#deleteModal", function (e) {
        if ($(e.target).is("#deleteModal")) hideDeleteModal();
    });
    $(document).off("keydown.pembayaran-delete").on("keydown.pembayaran-delete", function (e) {
        if (e.key === "Escape" && !$("#deleteModal").hasClass("hidden")) hideDeleteModal();
    });
}

/**
 * Initialize detail modal
 */
export function initDetailModal() {
    $(document).off("click", "#detailPembayaranModalClose").on("click", "#detailPembayaranModalClose", hideDetailModal);
    $(document).off("click", "#detailPembayaranModal").on("click", "#detailPembayaranModal", function (e) {
        if ($(e.target).is("#detailPembayaranModal")) hideDetailModal();
    });
    $(document).off("keydown.pembayaran-detail").on("keydown.pembayaran-detail", function (e) {
        if (e.key === "Escape" && !$("#detailPembayaranModal").hasClass("hidden")) hideDetailModal();
    });
}

/**
 * Open detail modal for payment
 */
function openPembayaranDetailModal(paymentId) {
    const payment = pembayaranData.find(p => p.id == paymentId);
    if (!payment) {
        showError("Data pembayaran tidak ditemukan");
        return;
    }

    // Fetch full detail dari server
    $.ajax({
        url: route('pembayaran.data'),
        method: 'GET',
        success: function(response) {
            const data = Array.isArray(response) ? response : (response?.data ?? []);
            const fullPayment = data.find(p => p.id == paymentId);
            if (fullPayment) {
                populatePembayaranDetailModal(fullPayment);
                showPembayaranDetailModal();
            }
        },
        error: function() {
            showError("Gagal memuat detail pembayaran");
        }
    });
}

/**
 * Populate modal with payment detail
 */
function populatePembayaranDetailModal(data) {
    const html = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <tbody>
                    <!-- PR Section -->
                    <tr class="bg-blue-50/30 dark:bg-blue-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">📋 PURCHASE REQUEST</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 w-1/3">PR Number</td>
                        <td class="px-4 py-2.5 font-semibold text-primary">${data.pr_number ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Request Type</td>
                        <td class="px-4 py-2.5">${data.pr_request_type ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Location</td>
                        <td class="px-4 py-2.5">${data.pr_location ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Classification</td>
                        <td class="px-4 py-2.5">${data.classification ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Approved Date</td>
                        <td class="px-4 py-2.5">${data.pr_approved_date ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Item Description</td>
                        <td class="px-4 py-2.5">${data.item_desc ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">UOM</td>
                        <td class="px-4 py-2.5">${data.item_uom ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">PR Quantity</td>
                        <td class="px-4 py-2.5">${data.pr_qty ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">PR Unit Price</td>
                        <td class="px-4 py-2.5">Rp. ${data.pr_unit_price ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">PR Amount</td>
                        <td class="px-4 py-2.5 font-semibold text-green-600 dark:text-green-400">Rp. ${data.pr_amount ?? '-'}</td>
                    </tr>

                    <!-- PO Section -->
                    <tr class="bg-amber-50/30 dark:bg-amber-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-amber-700 dark:text-amber-300">🛒 PURCHASE ORDER</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">PO Number</td>
                        <td class="px-4 py-2.5 font-bold text-primary">${data.po_number ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Supplier</td>
                        <td class="px-4 py-2.5">${data.po_supplier ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Approved Date</td>
                        <td class="px-4 py-2.5">${data.po_approved_date ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Quantity</td>
                        <td class="px-4 py-2.5">${data.qty ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Unit Price</td>
                        <td class="px-4 py-2.5">Rp. ${data.unit_price ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Amount</td>
                        <td class="px-4 py-2.5 font-semibold text-green-600 dark:text-green-400">Rp. ${data.amount ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Cost Saving</td>
                        <td class="px-4 py-2.5 font-semibold text-green-700 dark:text-green-400">Rp. ${data.cost_saving ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PR→PO Target</td>
                        <td class="px-4 py-2.5">${data.sla_pr_to_po_target ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PR→PO Realisasi</td>
                        <td class="px-4 py-2.5">${data.sla_pr_to_po_realization ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PR→PO %</td>
                        <td class="px-4 py-2.5 ${data.sla_pr_to_po_percentage === '100%' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'} font-bold">${data.sla_pr_to_po_percentage ?? '-'}</td>
                    </tr>

                    <!-- Onsite Section -->
                    <tr class="bg-red-50/30 dark:bg-red-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-red-700 dark:text-red-300">📍 ONSITE TRACKING</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Onsite Date</td>
                        <td class="px-4 py-2.5">${data.onsite_date ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PO→Onsite Target</td>
                        <td class="px-4 py-2.5">${data.sla_po_to_onsite_target ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PO→Onsite Realisasi</td>
                        <td class="px-4 py-2.5">${data.sla_po_to_onsite_realization ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PO→Onsite %</td>
                        <td class="px-4 py-2.5 ${data.sla_po_to_onsite_percentage === '100%' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'} font-bold">${data.sla_po_to_onsite_percentage ?? '-'}</td>
                    </tr>

                    <!-- Invoice Section -->
                    <tr class="bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-slate-700 dark:text-slate-300">📄 INVOICE</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Invoice Number</td>
                        <td class="px-4 py-2.5 font-semibold">${data.invoice_number ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Received Date</td>
                        <td class="px-4 py-2.5">${data.invoice_received_at ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Submit Date</td>
                        <td class="px-4 py-2.5">${data.invoice_submit ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA Target (Days)</td>
                        <td class="px-4 py-2.5">${data.sla_invoice_target ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA Realization (Days)</td>
                        <td class="px-4 py-2.5">${data.sla_invoice_realization ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA Invoice→Finance %</td>
                        <td class="px-4 py-2.5 ${data.sla_invoice_percentage === '100%' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'} font-bold">${data.sla_invoice_percentage ?? '-'}</td>
                    </tr>

                    <!-- Payment Section -->
                    <tr class="bg-green-50/30 dark:bg-green-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-green-700 dark:text-green-300">💰 PAYMENT</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Payment Number</td>
                        <td class="px-4 py-2.5 font-semibold">${data.payment_number ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Payment Date</td>
                        <td class="px-4 py-2.5">${data.payment_date ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA Payment (Days)</td>
                        <td class="px-4 py-2.5">${data.sla_payment ?? '-'}</td>
                    </tr>

                    <!-- Metadata -->
                    <tr class="bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-slate-700 dark:text-slate-300">ℹ️ METADATA</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Created By</td>
                        <td class="px-4 py-2.5">${data.created_by ?? '-'}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Created At</td>
                        <td class="px-4 py-2.5">${data.created_at ?? '-'}</td>
                    </tr>
                </tbody>
            </table>
        </div>`;

    $("#detailPembayaranContent").html(html);
}

/**
 * Show detail modal
 */
function showPembayaranDetailModal() {
    const modal = $("#detailPembayaranModal");
    const backdrop = $("#detailPembayaranModalBackdrop");
    const content = $("#detailPembayaranModalContent");

    modal.removeClass("hidden").css("opacity", "1");
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ transform: "scale(1)", opacity: "1" });
    });
}

/**
 * Close detail modal
 */
function closePembayaranDetailModal() {
    const backdrop = $("#detailPembayaranModalBackdrop");
    const content = $("#detailPembayaranModalContent");
    backdrop.css("opacity", "0");
    content.css({ transform: "scale(0.95)", opacity: "0" });
    setTimeout(() => {
        $("#detailPembayaranModal").addClass("hidden").css("opacity", "0");
    }, 300);
}
