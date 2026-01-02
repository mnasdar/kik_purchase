/*
 * Script: PO Read (Daftar)
 * Fungsi: Render tabel PO, refresh data tanpa reload halaman, toggle bulk delete, dan aksi edit
 * Penjelasan: Disamakan dengan modul purchase_request (Grid.js + tippy + toast)
 */
import $ from "jquery";
import { route } from "ziggy-js";
import { Grid, h } from "gridjs";
import tippy from "tippy.js";
import { showToast } from "../../../core/notification";

let gridInstance = null;
let prefix = null;
let poItemsGridInstance = null;
let currentFilters = {};

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
        { id: "request_type", name: "Type", width: "80px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "po_number", name: "PO Number", width: "140px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "supplier", name: "Supplier", width: "130px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "items_count", name: "Items", width: "100px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "total_pr_amount", name: h("div", { className: "whitespace-normal", innerHTML: "Total PR Amount" }), width: "140px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "total_amount", name: h("div", { className: "whitespace-normal", innerHTML: "Total PO Amount" }), width: "130px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "total_cost_saving", name: h("div", { className: "whitespace-normal", innerHTML: "Total Cost Saving" }), width: "140px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "approved_date", name: "Approved Date", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "created_by", name: "Created By", width: "120px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "actions", name: "Actions", width: "90px", sort: false, formatter: (cell) => h("div", { innerHTML: cell }) },
    ];
}

function fetchTableData(showNotification = false) {
    $.ajax({
        url: route("purchase-order.data", { prefix }),
        method: "GET",
        data: currentFilters,
        beforeSend: function () {
            if (showNotification) {
                showToast("Memuat data...", "info", 1000);
            }
        },
        success: function (data) {
            const gridData = data.map((item) => [
                item.checkbox,
                item.number,
                item.request_type,
                item.po_number,
                item.supplier,
                item.items_count,
                item.total_pr_amount,
                item.total_amount,
                item.total_cost_saving,
                item.approved_date,
                item.created_by,
                item.actions,
            ]);

            if (gridInstance) {
                gridInstance.updateConfig({ data: gridData }).forceRender();
            } else {
                gridInstance = new Grid({
                    columns: getTableColumns(),
                    data: gridData,
                    pagination: { limit: 10 },
                    search: true,
                    sort: true,
                });
                gridInstance.render(document.querySelector("#table-po"));
            }

            $("#data-count").text(data.length);

            setTimeout(() => {
                tippy("[data-plugin='tippy']", { arrow: true, animation: "scale" });
                initCheckboxEvents();
            }, 300);

            if (showNotification) {
                showToast("Data berhasil direfresh", "success", 1500);
            }
        },
        error: function () {
            if (showNotification) {
                showToast("Gagal memuat data", "error", 2000);
            }
        },
    });
}

function initCheckboxEvents() {
    $(document).off("change", "#headerCheck").on("change", "#headerCheck", function () {
        const isChecked = $(this).prop("checked");
        $(".form-checkbox").not("#headerCheck").prop("checked", isChecked);
        updateDeleteButton();
    });

    $(document).off("change", ".form-checkbox").on("change", ".form-checkbox", function () {
        if (!$(this).is("#headerCheck")) {
            updateDeleteButton();
            const total = $(".form-checkbox").not("#headerCheck").length;
            const checked = $(".form-checkbox:checked").not("#headerCheck").length;
            $("#headerCheck").prop("checked", total === checked);
        }
    });
}

function updateDeleteButton() {
    const checkedCount = $(".form-checkbox:checked").not("#headerCheck").length;
    const deleteBtn = $("#btn-delete-selected");
    if (checkedCount > 1) {
        deleteBtn.removeClass("hidden").prop("disabled", false);
    } else {
        deleteBtn.addClass("hidden").prop("disabled", true);
    }
}

export function initPOTable() {
    prefix = $("[data-prefix]").data("prefix") || window.__PO_PREFIX__ || "";
    if (!$("#table-po").length) return;
    fetchTableData(false);
}

export function initPORefresh() {
    $(document).off("click", "#btn-refresh").on("click", "#btn-refresh", function () {
        fetchTableData(true);
    });
}

export function initPOEdit() {
    $(document).off("click", ".btn-edit-po").on("click", ".btn-edit-po", function () {
        const id = $(this).data("id");
        const editUrl = route("purchase-order.edit", { prefix, purchase_order: id });
        window.location.href = editUrl;
    });
}

// expose checkbox updater for delete module
export function refreshPODeleteState() {
    updateDeleteButton();
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
            item_desc: $("#filter-item-desc").val(),
            pr_number: $("#filter-pr-number").val(),
            supplier_id: $("#filter-supplier").val(),
            request_type: $("#filter-request-type").val(),
            location_id: $("#filter-location").val(),
            current_stage: $("#filter-stage").val(),
            classification_id: $("#filter-classification").val(),
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
        $("#filter-item-desc").val("");
        $("#filter-pr-number").val("");
        $("#filter-supplier").val("");
        $("#filter-request-type").val("");
        $("#filter-location").val("");
        $("#filter-stage").val("");
        $("#filter-classification").val("");
        $("#filter-date-from").val("");
        $("#filter-date-to").val("");

        currentFilters = {};
        fetchTableData(true);
    });
}

/**
 * Initialize detail modal untuk menampilkan PO detail dengan items
 */
export function initDetailModal() {
    // Setup modal close button
    $(document).on("click", "#detailPOModalClose, #detailPOModalBackdrop", function() {
        closePODetailModal();
    });

    // Close modal when ESC key pressed
    $(document).on("keydown", function(e) {
        if (e.key === "Escape") {
            closePODetailModal();
        }
    });

    // Handle items_count click
    $(document).on("click", ".po-items-count", function(e) {
        e.preventDefault();
        const poId = $(this).data("po-id");
        if (poId) {
            openPODetailModal(poId);
        }
    });
}

/**
 * Open PO detail modal dan fetch data
 */
function openPODetailModal(poId) {
    const modal = $("#detailPOModal");
    const backdrop = $("#detailPOModalBackdrop");
    const content = $("#detailPOModalContent");

    // Show with animation
    modal.removeClass("hidden");
    modal.css("opacity", "1");
    setTimeout(() => {
        backdrop.css("opacity", "1");
        content.css({ transform: "scale(1)", opacity: "1" });
    }, 10);

    // Fetch PO detail
    $.ajax({
        url: route("purchase-order.detail", { prefix, purchase_order: poId }),
        method: "GET",
        success: function(response) {
            populatePODetailModal(response);
        },
        error: function(xhr) {
            console.error("Error loading PO detail:", xhr);
            showToast("Gagal memuat detail PO", "error", 2000);
            closePODetailModal();
        }
    });
}

/**
 * Close PO detail modal
 */
function closePODetailModal() {
    const modal = $("#detailPOModal");
    const backdrop = $("#detailPOModalBackdrop");
    const content = $("#detailPOModalContent");

    backdrop.css("opacity", "0");
    content.css({ transform: "scale(0.95)", opacity: "0" });
    modal.css("opacity", "0");
    
    setTimeout(() => {
        modal.addClass("hidden");
    }, 300);
}

/**
 * Populate PO detail modal dengan data using Grid.js
 */
function populatePODetailModal(data) {
    const { po, items } = data;

    // Populate PO info
    $("#detailPONumber").text(po.po_number);
    $("#detailPOApprovedDate").text(po.approved_date);
    $("#detailPOSupplier").text(po.supplier);
    $("#detailPOCreatedBy").text(po.created_by);
    $("#detailPOCreatedAt").text(po.created_at);
    $("#detailPONotes").text(po.notes);

    // Render items grid with pagination and search
    const gridContainer = document.querySelector("#detailPOItemsGrid");
    if (!gridContainer) return;

    const gridData = items.map((item, idx) => [
        idx + 1,
        item.pr_number,
        item.pr_location,
        item.pr_item_desc,
        item.pr_uom,
        item.pr_approved_date,
        `Rp ${item.pr_unit_price}`,
        item.pr_qty,
        `Rp ${item.pr_amount}`,
        `Rp ${item.po_unit_price}`,
        item.po_qty,
        `Rp ${item.po_amount}`,
        `Rp ${item.cost_saving}`,
        item.percent_cost_saving,
        item.target_pr_to_po,
        item.sla_pr_to_po,
        item.percent_sla,
    ]);

    const columns = [
        { id: "number", name: "#", width: "50px" },
        { id: "pr_number", name: "PR Number", width: "140px" },
        { id: "pr_location", name: "Location", width: "130px" },
        { id: "pr_item_desc", name: "Item Desc", width: "200px" },
        { id: "pr_uom", name: "UOM", width: "80px" },
        { id: "pr_approved_date", name: h("div", { className: "whitespace-normal", innerHTML: "PR Approved Date" }), width: "130px" },
        { id: "pr_unit_price", name: h("div", { className: "whitespace-normal", innerHTML: "PR Unit Price" }), width: "120px" },
        { id: "pr_qty", name: h("div", { className: "whitespace-normal", innerHTML: "PR Qty" }), width: "80px" },
        { id: "pr_amount", name: h("div", { className: "whitespace-normal", innerHTML: "PR Amount" }), width: "130px" },
        { id: "po_unit_price", name: h("div", { className: "whitespace-normal", innerHTML: "PO Unit Price" }), width: "120px" },
        { id: "po_qty", name: h("div", { className: "whitespace-normal", innerHTML: "PO Qty" }), width: "80px" },
        { id: "po_amount", name: h("div", { className: "whitespace-normal", innerHTML: "PO Amount" }), width: "130px" },
        { id: "cost_saving", name: h("div", { className: "whitespace-normal", innerHTML: "Cost Saving" }), width: "120px" },
        { id: "percent_cost_saving", name: h("div", { className: "whitespace-normal", innerHTML: "% Cost Saving" }), width: "110px" },
        { id: "target_pr_to_po", name: h("div", { className: "whitespace-normal", innerHTML: "SLA Target PR→PO" }), width: "100px" },
        { id: "sla_pr_to_po", name: h("div", { className: "whitespace-normal", innerHTML: "SLA Realisasi PR→PO" }), width: "100px" },
        { id: "percent_sla", name: "% SLA", width: "90px" },
    ];

    if (poItemsGridInstance) {
        poItemsGridInstance.updateConfig({ data: gridData, columns, pagination: { limit: 10 }, search: true }).forceRender();
    } else {
        poItemsGridInstance = new Grid({
            columns,
            data: gridData,
            pagination: { limit: 10 },
            search: true,
            sort: true,
        });
        poItemsGridInstance.render(gridContainer);
    }
}

// Inisialisasi dilakukan dari entry point index.js
