/**
 * Modul Invoice - Read (Daftar)
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
        { id: "item_desc", name: "Item Description", width: "300px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "unit_price", name: "Unit Price", width: "120px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-slate-700 dark:text-slate-300">${cell}</span>` }) },
        { id: "qty", name: "Qty", width: "70px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-center block">${cell}</span>` }) },
        { id: "amount", name: "Amount", width: "120px", formatter: (cell) => h("div", { innerHTML: `<span class="font-semibold text-green-600 dark:text-green-400">${cell}</span>` }) },
        { id: "onsite_date", name: "Tgl PO Onsite", width: "130px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "sla_target", name: h("div", { className: "whitespace-normal", innerHTML: "SLA Target"}), width: "80px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "current_stage", name: "Status", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "created_by", name:  h("div", { className: "whitespace-normal", innerHTML: "Created By"}), width: "100px", formatter: (cell) => h("div", { innerHTML: cell }) },
    ];
}

function getStatusBadgeClass(status) {
    const statusClasses = {
        'PR Created': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'PO Created': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        'PO Onsite': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
        'Invoice Received': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'Payment Done': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    };
    return statusClasses[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
}

function fetchTableData(showNotification = false) {
    $.ajax({
        url: route("dari-vendor.data"),
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
                    item.onsite_date,
                    item.sla_invoice_to_finance_target,
                    item.current_stage,
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
                }).render(document.getElementById("table-invoice"));
            }

            $("#data-count").text(data.length);

            setTimeout(() => {
                tippy("[data-tippy-content]", { arrow: true, placement: "top" });
                initCheckboxEvents();
            }, 100);

            if (showNotification) {
                showToast("Data berhasil dimuat!", "success", 1500);
            }
        },
        error: function () {
            showError("Gagal memuat data invoice", "Error!");
        },
    });
}

function initCheckboxEvents() {
    $(document).off("change", "#headerCheck").on("change", "#headerCheck", function () {
        const isChecked = $(this).is(":checked");
        $(".form-checkbox").not(this).prop("checked", isChecked);
        updateDeleteButton();
    });

    $(document).off("change", ".form-checkbox").on("change", ".form-checkbox", function () {
        const allChecked = $(".form-checkbox").not("#headerCheck").length === $(".form-checkbox:checked").not("#headerCheck").length;
        $("#headerCheck").prop("checked", allChecked);
        updateDeleteButton();
    });
}

function updateDeleteButton() {
    const checkedCount = $(".form-checkbox:checked").not("#headerCheck").length;
    const deleteBtn = $("#btn-delete-selected");
    const editBtn = $("#btn-edit-selected");
    
    if (checkedCount > 0) {
        deleteBtn.removeClass("hidden");
        editBtn.removeClass("hidden");
        $("#delete-count").text(checkedCount);
        $("#edit-count").text(checkedCount);
    } else {
        deleteBtn.addClass("hidden");
        editBtn.addClass("hidden");
    }
}

/**
 * Initialize bulk edit button
 */
export function initBulkEdit() {
    $(document).off("click", "#btn-edit-selected").on("click", "#btn-edit-selected", function () {
        const selectedIds = $(".form-checkbox:checked").not("#headerCheck")
            .map(function () {
                return $(this).val();
            })
            .get();

        if (selectedIds.length === 0) {
            showToast("Pilih minimal 1 item untuk diedit", "warning", 2000);
            return;
        }

        // Redirect to bulk edit page with selected IDs
        const idsParam = selectedIds.join(",");
        window.location.href = route("dari-vendor.bulk-edit", { ids: idsParam });
    });
}

export function initInvoiceTable() {
    if (!$("#table-invoice").length) return;
    fetchTableData(false);
}

export function initInvoiceRefresh() {
    $(document).off("click", "#btn-refresh").on("click", "#btn-refresh", function () {
        fetchTableData(true);
    });
}

export default { initInvoiceTable, initInvoiceRefresh, initBulkEdit };
