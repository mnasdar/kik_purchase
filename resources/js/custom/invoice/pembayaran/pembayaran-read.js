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
        { id: "po_number", name: "No PO", width: "130px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-primary">${cell}</span>` }) },
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
        success: function (data) {
            pembayaranData = data;
            const tableData = data.map((item) => {
                return [
                    `<input type="checkbox" class="form-checkbox rounded text-primary" value="${item.id}">`,
                    item.number,
                    item.payment_number,
                    `<span class="font-semibold text-primary">${item.po_number}</span>`,
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

            updateStats(data);
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
function updateStats(data) {
    const total = data.length;
    const paid = data.filter(item => item.payment_date && item.payment_date !== '-').length;
    const pending = total - paid;
    
    // Calculate recent (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const recent = data.filter(item => {
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

    $("#stat-total").text(total);
    $("#stat-paid").text(paid);
    $("#stat-pending").text(pending);
    $("#stat-recent").text(recent);
    
    // Update delete button count
    updateDeleteCount();
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
