/**
 * Modul Pengajuan Invoice - Read & Bulk Submit
 */
import $ from "jquery";
import { Grid, h } from "gridjs";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showToast, showError } from "../../../core/notification";
import Swal from "sweetalert2";

let gridInstance = null;

function openPengajuanDetailModal(invoiceId) {
    const modal = $("#detailInvoiceModal");
    const backdrop = $("#detailInvoiceModalBackdrop");
    const content = $("#detailInvoiceModalContent");

    modal.removeClass("hidden");
    modal.css("opacity", "1");
    setTimeout(() => {
        backdrop.css("opacity", "1");
        content.css({ transform: "scale(1)", opacity: "1" });
    }, 10);

    $.ajax({
        url: route("pengajuan.show", { pengajuan: invoiceId }),
        method: "GET",
        success: function (data) {
            populateInvoiceDetailModal(data);
        },
        error: function () {
            showError("Gagal memuat detail invoice", "Error!");
            closePengajuanDetailModal();
        },
    });
}

function closePengajuanDetailModal() {
    const backdrop = $("#detailInvoiceModalBackdrop");
    const content = $("#detailInvoiceModalContent");
    const modal = $("#detailInvoiceModal");

    backdrop.css("opacity", "0");
    content.css({ transform: "scale(0.95)", opacity: "0" });
    setTimeout(() => {
        modal.addClass("hidden").css("opacity", "0");
    }, 300);
}

function populateInvoiceDetailModal(data) {
    const html = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <tbody>
                    <!-- PR Section -->
                    <tr class="bg-blue-50/30 dark:bg-blue-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">📋 PURCHASE REQUEST</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5">Request Type</td><td class="px-4 py-2.5 font-semibold">${data.pr_request_type}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5">PR Number</td><td class="px-4 py-2.5 font-semibold">${data.pr_number}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Location</td><td class="px-4 py-2.5 font-semibold">${data.pr_location}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Classification</td><td class="px-4 py-2.5 font-semibold">${data.classification}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Approved Date</td><td class="px-4 py-2.5 font-semibold">${data.pr_approved_date}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Item Description</td><td class="px-4 py-2.5 font-semibold">${data.item_name}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">UOM</td><td class="px-4 py-2.5 font-semibold">${data.unit}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Quantity</td><td class="px-4 py-2.5 font-semibold">${data.pr_quantity}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Unit Price</td><td class="px-4 py-2.5 font-semibold">${data.pr_unit_price}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Amount</td><td class="px-4 py-2.5 font-semibold">${data.pr_amount}</td></tr>

                    <!-- PO Section -->
                    <tr class="bg-amber-50/30 dark:bg-amber-950/20 border-b border-slate-200 dark:border-slate-700"><td colspan="2" class="px-4 py-2 font-bold text-amber-700 dark:text-amber-300">🛒 PURCHASE ORDER</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">PO Number</td><td class="px-4 py-2.5 font-bold text-primary">${data.po_number}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Supplier</td><td class="px-4 py-2.5 font-semibold">${data.supplier_name}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">PO Approved Date</td><td class="px-4 py-2.5 font-semibold">${data.po_approved_date}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Quantity</td><td class="px-4 py-2.5 font-semibold">${data.po_quantity}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Unit Price</td><td class="px-4 py-2.5 font-semibold">${data.po_unit_price}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Amount</td><td class="px-4 py-2.5 font-semibold">${data.po_amount}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Cost Saving</td><td class="px-4 py-2.5 font-semibold">${data.cost_saving}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">SLA PR→PO Target</td><td class="px-4 py-2.5 font-semibold">${data.sla_pr_to_po_target}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">SLA PR→PO Realisasi</td><td class="px-4 py-2.5 font-semibold">${data.sla_pr_to_po_realization}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">SLA PR→PO %</td><td class="px-4 py-2.5 ${
                        data.sla_pr_to_po_percentage === "100%" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                    } font-bold">${data.sla_pr_to_po_percentage}</td></tr>

                    <!-- Onsite Section -->
                    <tr class="bg-red-50/30 dark:bg-red-950/20 border-b border-slate-200 dark:border-slate-700"><td colspan="2" class="px-4 py-2 font-bold text-red-700 dark:text-red-300">📍 ONSITE TRACKING</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Onsite Date</td><td class="px-4 py-2.5 font-semibold">${data.onsite_date}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">SLA PO→Onsite Target</td><td class="px-4 py-2.5 font-semibold">${data.sla_po_to_onsite_target}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">SLA PO→Onsite Realisasi</td><td class="px-4 py-2.5 font-semibold">${data.sla_po_to_onsite_realization}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">SLA PO→Onsite %</td><td class="px-4 py-2.5 ${
                        data.sla_po_to_onsite_percentage === "100%" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                    } font-bold">${data.sla_po_to_onsite_percentage}</td></tr>

                    <!-- Invoice Section -->
                    <tr class="bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700"><td colspan="2" class="px-4 py-2 font-bold text-slate-700 dark:text-slate-300">ℹ️ INVOICE</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Invoice Number</td><td class="px-4 py-2.5 font-semibold">${data.invoice_number}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Invoice Received At</td><td class="px-4 py-2.5 font-semibold">${data.invoice_received_at}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Invoice Submitted At</td><td class="px-4 py-2.5 font-semibold">${data.invoice_submitted_at}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">SLA Invoice→Finance Target</td><td class="px-4 py-2.5 font-semibold">${data.sla_invoice_to_finance_target}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">SLA Invoice→Finance Realisasi</td><td class="px-4 py-2.5 font-semibold">${data.sla_invoice_to_finance_realization ?? '-'}</td></tr>

                    <!-- Metadata -->
                    <tr class="bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700"><td colspan="2" class="px-4 py-2 font-bold text-slate-700 dark:text-slate-300">ℹ️ Metadata</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Created By</td><td class="px-4 py-2.5 font-semibold">${data.created_by}</td></tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-4 py-2.5">Created At</td><td class="px-4 py-2.5 font-semibold">${data.created_at}</td></tr>
                </tbody>
            </table>
        </div>`;

    $("#detailInvoiceContent").html(html);
}

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
        { id: "number", name: "#", width: "60px" },
        { id: "invoice_number", name: "Invoice Number", width: "140px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "po_number", name: "PO Number", width: "150px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "item_desc", name: "Item Description", width: "250px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "unit_price", name: "Unit Price", width: "120px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-slate-700 dark:text-slate-300">${cell}</span>` }) },
        { id: "qty", name: "Qty", width: "80px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-center block">${cell}</span>` }) },
        { id: "amount", name: "Amount", width: "120px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-green-600 dark:text-green-400">${cell}</span>` }) },
        { id: "received_date", name: "Tgl Diterima", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "invoice_submitted_at", name: "Tgl Pengajuan", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "sla_target", name: h("div", { className: "whitespace-normal", innerHTML: "SLA Target"}), width: "70px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "sla_realization", name: h("div", { className: "whitespace-normal", innerHTML: "SLA Realisasi"}), width: "70px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "created_by", name: h("div", { className: "whitespace-normal", innerHTML: "Created By"}), width: "100px", formatter: (cell) => h("div", { innerHTML: cell }) },
    ];
}

function fetchTableData(showNotification = false) {
    $.ajax({
        // Tampilkan data pengajuan yang sudah diajukan namun belum dibayar pada index
        url: route("pengajuan.data"),
        method: "GET",
        beforeSend: function () {
            if (showNotification) {
                showToast("Memuat data...", "info", 1000);
            }
        },
        success: function (data) {
            const tableData = data.map((item) => {
                return [
                    `<input type="checkbox" class="form-checkbox rounded text-primary" value="${item.id}">`,
                    item.number,
                    `<span class="font-semibold text-slate-700 dark:text-slate-300">${item.invoice_number}</span>`,
                    `<button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 hover:shadow-md transition-all duration-200 pengajuan-po-click" data-invoice-id="${item.id}"><span>${item.po_number}</span></button>`,
                    item.item_desc,
                    item.unit_price,
                    item.qty,
                    item.amount,
                    // Ganti: kolom pertama tanggal = Tgl Diterima (invoice_received_at)
                    item.invoice_received_at,
                    // Ganti: kolom kedua tanggal = Tgl Pengajuan (invoice_submitted_at)
                    item.invoice_submitted_at,
                    item.sla_target,
                    item.sla_realization,
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
                }).render(document.getElementById("table-pengajuan"));
            }

            $("#data-count").text(data.length);
            $("#headerCheck").prop("checked", false).prop("disabled", false);
            $(".form-checkbox").prop("checked", false).prop("disabled", false);
            $("#btn-bulk-edit").addClass("hidden");

            setTimeout(() => {
                tippy("[data-tippy-content]", { arrow: true, placement: "top" });
                initCheckboxEvents();
                $(document)
                    .off("click", ".pengajuan-po-click")
                    .on("click", ".pengajuan-po-click", function (e) {
                        e.preventDefault();
                        const invoiceId = $(this).data("invoice-id");
                        if (invoiceId) openPengajuanDetailModal(invoiceId);
                    });
                $(document)
                    .off("click", "#detailInvoiceModalClose, #detailInvoiceModalBackdrop")
                    .on("click", "#detailInvoiceModalClose, #detailInvoiceModalBackdrop", function () {
                        closePengajuanDetailModal();
                    });
            }, 100);

            if (showNotification) {
                showToast("Data berhasil dimuat!", "success", 1500);
            }
        },
        error: function () {
            showError("Gagal memuat data pengajuan", "Error!");
        },
    });
}

function initCheckboxEvents() {
    $(document)
        .off("change", "#headerCheck")
        .on("change", "#headerCheck", function () {
            const isChecked = $(this).is(":checked");
            $(".form-checkbox").not(this).prop("checked", isChecked);
            updateSubmitButton();
        });

    $(document)
        .off("change", ".form-checkbox")
        .on("change", ".form-checkbox", function () {
            const allChecked =
                $(".form-checkbox").not("#headerCheck").length ===
                $(".form-checkbox:checked").not("#headerCheck").length;
            $("#headerCheck").prop("checked", allChecked);
            updateSubmitButton();
        });
}

function updateSubmitButton() {
    const checkedCount = $(".form-checkbox:checked").not("#headerCheck").length;
    const editBtn = $("#btn-bulk-edit");
    const deleteBtn = $("#btn-bulk-delete");

    if (checkedCount > 0) {
        editBtn.removeClass("hidden");
        deleteBtn.removeClass("hidden");
        $("#edit-count").text(checkedCount);
        $("#delete-count").text(checkedCount);
    } else {
        editBtn.addClass("hidden");
        deleteBtn.addClass("hidden");
        $("#edit-count").text(0);
        $("#delete-count").text(0);
    }
}

function getSelectedIds() {
    return $(".form-checkbox:checked").not("#headerCheck")
        .map(function () {
            return $(this).val();
        })
        .get();
}

export function initBulkEdit() {
    $(document)
        .off("click", "#btn-bulk-edit")
        .on("click", "#btn-bulk-edit", function () {
            const selectedIds = getSelectedIds();
            if (selectedIds.length === 0) {
                showToast("Pilih minimal 1 invoice", "warning", 1500);
                return;
            }
            const url = route("pengajuan.bulk-edit") + `?ids=${selectedIds.join(',')}`;
            window.location.href = url;
        });
}

export function initBulkDelete() {
    $(document)
        .off("click", "#btn-bulk-delete")
        .on("click", "#btn-bulk-delete", async function () {
            const selectedIds = getSelectedIds();
            if (selectedIds.length === 0) {
                showToast("Pilih minimal 1 invoice", "warning", 1500);
                return;
            }

            const result = await Swal.fire({
                title: "Hapus Invoice Terpilih?",
                html: `Anda akan menghapus <strong>${selectedIds.length} invoice</strong> dari daftar pengajuan.<br><span class="text-red-600">Tindakan ini tidak dapat dibatalkan.</span>`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Ya, Hapus!",
                cancelButtonText: "Batal",
            });

            if (!result.isConfirmed) return;

            $.ajax({
                url: route("pengajuan.bulkDestroy"),
                method: "DELETE",
                data: {
                    ids: selectedIds,
                    _token: $("meta[name='csrf-token']").attr("content"),
                },
                beforeSend: function () {
                    showToast("Menghapus data...", "info", 2000);
                },
                success: function (response) {
                    showToast(response.message || "Data berhasil dihapus", "success", 2000);
                    fetchTableData(false);
                },
                error: function (xhr) {
                    const errorMsg = xhr.responseJSON?.message || "Gagal menghapus data";
                    showError(errorMsg, "Error!");
                },
            });
        });
}

export function initPengajuanTable() {
    if (!$("#table-pengajuan").length) return;
    fetchTableData(false);
}

export function initPengajuanRefresh() {
    $(document)
        .off("click", "#btn-refresh")
        .on("click", "#btn-refresh", function () {
            fetchTableData(true);
        });
}

export default { initPengajuanTable, initPengajuanRefresh, initBulkEdit, initBulkDelete };
