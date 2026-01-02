/**
 * Modul Riwayat Pengajuan Invoice - Read & Bulk Edit
 */
import $ from "jquery";
import { Grid, h } from "gridjs";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showToast, showError } from "../../../core/notification";

let gridInstance = null;

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
        { id: "po_number", name: "PO Number", width: "140px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "pr_number", name: "PR Number", width: "140px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "item_desc", name: "Item Description", width: "250px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "unit_price", name: "Unit Price", width: "120px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-slate-700 dark:text-slate-300">${cell}</span>` }) },
        { id: "qty", name: "Qty", width: "80px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-center block">${cell}</span>` }) },
        { id: "amount", name: "Amount", width: "120px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-green-600 dark:text-green-400">${cell}</span>` }) },
        { id: "invoice_received_at", name: "Tgl Diterima", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "invoice_submitted_at", name: "Tgl Diajukan", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "sla_target", name: h("div", { className: "whitespace-normal", innerHTML: "SLA Target"}), width: "70px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "sla_realization", name: h("div", { className: "whitespace-normal", innerHTML: "SLA Realisasi"}), width: "70px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "created_by", name: h("div", { className: "whitespace-normal", innerHTML: "Created By"}), width: "100px", formatter: (cell) => h("div", { innerHTML: cell }) },
    ];
}

function fetchTableData(showNotification = false) {
    $.ajax({
        url: route("pengajuan.history-data"),
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
                    `<span class="font-semibold text-primary">${item.po_number}</span>`,
                    item.pr_number,
                    item.item_desc,
                    item.unit_price,
                    item.qty,
                    item.amount,
                    item.invoice_received_at,
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
                }).render(document.getElementById("table-history"));
            }

            $("#data-count").text(data.length);
            $("#headerCheck").prop("checked", false);
            $("#btn-edit-selected").addClass("hidden");
            $("#edit-count").text(0);

            setTimeout(() => {
                tippy("[data-tippy-content]", { arrow: true, placement: "top" });
                initCheckboxEvents();
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
            updateEditButton();
        });

    $(document)
        .off("change", ".form-checkbox")
        .on("change", ".form-checkbox", function () {
            const allChecked =
                $(".form-checkbox").not("#headerCheck").length ===
                $(".form-checkbox:checked").not("#headerCheck").length;
            $("#headerCheck").prop("checked", allChecked);
            updateEditButton();
        });
}

function updateEditButton() {
    const checkedCount = $(".form-checkbox:checked").not("#headerCheck").length;
    const editBtn = $("#btn-edit-selected");

    if (checkedCount > 0) {
        editBtn.removeClass("hidden");
        $("#edit-count").text(checkedCount);
    } else {
        editBtn.addClass("hidden");
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
        .off("click", "#btn-edit-selected")
        .on("click", "#btn-edit-selected", function () {
            const selectedIds = getSelectedIds();

            if (selectedIds.length === 0) {
                showToast("Pilih minimal 1 item untuk diedit", "warning", 2000);
                return;
            }

            const idsParam = selectedIds.join(",");
            window.location.href = route("pengajuan.bulk-edit", { ids: idsParam });
        });
}

export function initHistoryTable() {
    if (!$("#table-history").length) return;
    fetchTableData(false);
}

export function initHistoryRefresh() {
    $(document)
        .off("click", "#btn-refresh")
        .on("click", "#btn-refresh", function () {
            fetchTableData(true);
        });
}

export default { initHistoryTable, initHistoryRefresh, initBulkEdit };
