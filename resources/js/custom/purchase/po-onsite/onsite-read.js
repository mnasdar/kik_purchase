/**
 * Modul PO Onsite - Read (Daftar)
 * Fungsi: Render tabel onsite, refresh data, toggle bulk delete, dan aksi edit
 */
import $ from "jquery";
import { Grid, h } from "gridjs";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showToast, showError } from "../../../core/notification";

let gridInstance = null;
let currentFilters = {};

function getTableColumns() {
    return [
        {
            id: "checkbox",
            name: h("div", {
                innerHTML: '<input type="checkbox" id="headerCheck" class="form-checkbox rounded text-primary">',
            }),
            width: "43px",
            sort: false,
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        { id: "number", name: "#", width: "50px" },
        { id: "po_number", name: "PO Number", width: "130px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "pr_number", name: "PR Number", width: "130px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "item_name", name: "Item Description", width: "180px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "quantity", name: "Qty", width: "60px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "po_unit_price", name: "Unit Price", width: "100px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "po_amount", name: "Amount", width: "110px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "po_date", name: "PO Date", width: "90px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "onsite_date", name: "Onsite", width: "90px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "sla_target", name: h("div", { className: "whitespace-normal", innerHTML: "SLA Target"}), width: "70px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "sla_realization", name: h("div", { className: "whitespace-normal", innerHTML: "SLA Real"}), width: "70px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "percent_sla", name: "%", width: "55px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "status", name: "Status", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "created_by", name: "Created By", width: "90px", formatter: (cell) => h("div", { innerHTML: cell }) },
    ];
}

function fetchTableData(showNotification = false) {
    $.ajax({
        url: route("po-onsite.data"),
        method: "GET",
        data: currentFilters,
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
                    `<span class="font-semibold text-primary">${item.po_number}</span>`,
                    item.pr_number,
                    item.item_desc,
                    item.quantity,
                    item.po_unit_price,
                    item.po_amount,
                    item.po_date,
                    item.onsite_date,
                    item.sla_target,
                    item.sla_realization,
                    item.percent_sla,
                    item.status,
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
                }).render(document.getElementById("table-onsite"));
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
            showError("Gagal memuat data onsite", "Error!");
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

export function initOnsiteTable() {
    if (!$("#table-onsite").length) return;
    fetchTableData(false);
}

export function initOnsiteRefresh() {
    $(document).off("click", "#btn-refresh").on("click", "#btn-refresh", function () {
        fetchTableData(true);
    });
}

export function initOnsiteEdit() {
    $(document).off("click", ".btn-edit-onsite").on("click", ".btn-edit-onsite", function () {
        const id = $(this).data("id");
        window.location.href = route("po-onsite.edit", { po_onsite: id });
    });
}

export function refreshOnsiteDeleteState() {
    updateDeleteButton();
}

/**
 * Initialize multiple edit functionality
 */
export function initMultipleEdit() {
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
        window.location.href = route("po-onsite.bulk-edit", { ids: idsParam });
    });
}

/**
 * Initialize detail modal untuk menampilkan onsite detail
 */
export function initDetailModal() {
    // Setup modal close button
    $(document).on("click", "#detailOnsiteModalClose, #detailOnsiteModalBackdrop", function() {
        closeOnsiteDetailModal();
    });

    // Close modal when ESC key pressed
    $(document).on("keydown", function(e) {
        if (e.key === "Escape" && !$("#detailOnsiteModal").hasClass("hidden")) {
            closeOnsiteDetailModal();
        }
    });
}

/**
 * Open onsite detail modal dan fetch data
 */
function openOnsiteDetailModal(onsiteId) {
    const modal = $("#detailOnsiteModal");
    const backdrop = $("#detailOnsiteModalBackdrop");
    const content = $("#detailOnsiteModalContent");

    // Show with animation
    modal.removeClass("hidden");
    modal.css("opacity", "1");
    setTimeout(() => {
        backdrop.css("opacity", "1");
        content.css({ transform: "scale(1)", opacity: "1" });
    }, 10);

    // Fetch data
    $.ajax({
        url: route("po-onsite.show", { po_onsite: onsiteId }),
        method: "GET",
        success: function(data) {
            populateOnsiteDetailModal(data);
        },
        error: function() {
            showError("Gagal memuat detail onsite", "Error!");
            closeOnsiteDetailModal();
        }
    });
}

/**
 * Close onsite detail modal
 */
function closeOnsiteDetailModal() {
    const backdrop = $("#detailOnsiteModalBackdrop");
    const content = $("#detailOnsiteModalContent");
    const modal = $("#detailOnsiteModal");

    backdrop.css("opacity", "0");
    content.css({ transform: "scale(0.95)", opacity: "0" });
    setTimeout(() => {
        modal.addClass("hidden").css("opacity", "0");
    }, 300);
}

/**
 * Populate onsite detail modal dengan data
 */
function populateOnsiteDetailModal(data) {
    const statusBadge = data.status === 'Completed' 
        ? '<span class="badge bg-success text-white">Completed</span>'
        : '<span class="badge bg-warning text-white">Pending</span>';

    const html = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">PO Number</label>
                    <p class="font-semibold text-primary">${data.po_number}</p>
                </div>
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">PR Number</label>
                    <p class="font-semibold">${data.pr_number}</p>
                </div>
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">Item Name</label>
                    <p class="font-semibold">${data.item_name}</p>
                </div>
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">Quantity</label>
                    <p class="font-semibold">${data.quantity} ${data.unit}</p>
                </div>
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">Onsite Date</label>
                    <p class="font-semibold">${data.onsite_date}</p>
                </div>
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">SLA Target</label>
                    <p class="font-semibold">${data.sla_target} hari</p>
                </div>
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">SLA Realisasi</label>
                    <p class="font-semibold">${data.sla_realization} hari</p>
                </div>
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">Status</label>
                    <p>${statusBadge}</p>
                </div>
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">Created By</label>
                    <p class="font-semibold">${data.created_by}</p>
                </div>
                <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">Created At</label>
                    <p class="font-semibold">${data.created_at}</p>
                </div>
            </div>
        </div>
    `;

    $("#detailOnsiteContent").html(html);
}

/**
 * Initialize filter functionality (toggle, apply, clear)
 */
export function initFilterControls() {
    // Toggle filter section
    $(document).off("click", "#btn-toggle-filter").on("click", "#btn-toggle-filter", function () {
        $("#filter-section").toggleClass("hidden");
    });

    // Apply filter
    $(document).off("click", "#btn-apply-filter").on("click", "#btn-apply-filter", function () {
        currentFilters = {
            po_number: $("#filter-po-number").val(),
            pr_number: $("#filter-pr-number").val(),
            item_desc: $("#filter-item-desc").val(),
            location_id: $("#filter-location").val(),
            classification_id: $("#filter-classification").val(),
            current_stage: $("#filter-stage").val(),
            date_from: $("#filter-date-from").val(),
            date_to: $("#filter-date-to").val(),
        };

        // Remove empty values
        Object.keys(currentFilters).forEach((k) => {
            if (!currentFilters[k]) delete currentFilters[k];
        });

        fetchTableData(true);
    });

    // Clear filter
    $(document).off("click", "#btn-clear-filter").on("click", "#btn-clear-filter", function () {
        $("#filter-po-number").val("");
        $("#filter-pr-number").val("");
        $("#filter-item-desc").val("");
        $("#filter-location").val("");
        $("#filter-classification").val("");
        $("#filter-stage").val("");
        $("#filter-date-from").val("");
        $("#filter-date-to").val("");

        currentFilters = {};
        fetchTableData(true);
    });
}

export default { initOnsiteTable, initOnsiteRefresh, initOnsiteEdit, initDetailModal, initFilterControls };
