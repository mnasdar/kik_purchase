/**
 * Modul Purchase Request - Read
 * Mengelola tabel purchase request
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { Grid, h } from "gridjs";
import tippy from "tippy.js";
import { showToast } from "../../../core/notification.js";

let gridInstance = null;
let prefix = null;
let prItemsGridInstance = null;
let currentFilters = {};

/**
 * Get table columns configuration
 */
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
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "request_type",
            name: "Type",
            width: "70px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "pr_number",
            name: "PR Number",
            width: "180px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "location",
            name: "Location",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "items_count",
            name: "Items",
            width: "100px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "total_amount",
            name: "Total Amount",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "approved_date",
            name: "Approved Date",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "created_by",
            name: "Created By",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "actions",
            name: "Actions",
            width: "100px",
            sort: false,
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];
}

/**
 * Fetch and render table data
 */
function fetchTableData(showNotification = false) {
    $.ajax({
        url: route("purchase-request.data", { prefix }),
        method: "GET",
        data: currentFilters,
        dataType: "json",
        beforeSend: function() {
            if (showNotification) {
                showToast('Memuat data...', 'info', 1000);
            }
        },
        success: function (data) {
            // Ensure data is an array
            if (!Array.isArray(data)) {
                console.error("Invalid response format. Expected array, got:", typeof data);
                showToast('Format data tidak valid', 'error', 2000);
                return;
            }

            const gridData = data.map((item) => [
                item.checkbox,
                item.number,
                item.request_type,
                item.pr_number,
                item.location,
                item.items_count,
                item.total_amount,
                item.approved_date,
                item.created_by,
                item.actions,
            ]);

            if (gridInstance) {
                // Update existing grid
                gridInstance.updateConfig({
                    data: gridData,
                }).forceRender();
            } else {
                // Create new grid
                gridInstance = new Grid({
                    columns: getTableColumns(),
                    data: gridData,
                    pagination: {
                        limit: 10,
                    },
                    search: true,
                    sort: true,
                });

                gridInstance.render(document.querySelector("#table-pr"));
            }

            // Update count
            $("#data-count").text(data.length);

            // Initialize tooltips after render
            setTimeout(() => {
                tippy("[data-plugin='tippy']", {
                    arrow: true,
                    animation: "scale",
                });

                // Setup checkbox events
                initCheckboxEvents();
            }, 300);

            if (showNotification) {
                showToast('Data berhasil direfresh', 'success', 1500);
            }
        },
        error: function (xhr, status, error) {
            let errorMessage = 'Gagal memuat data';
            let detailedError = '';

            // Try to parse error response
            try {
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                    detailedError = xhr.responseJSON.error || '';
                } else if (xhr.responseText) {
                    const parsed = JSON.parse(xhr.responseText);
                    errorMessage = parsed.message || errorMessage;
                    detailedError = parsed.error || '';
                }
            } catch (e) {
                // If JSON parse fails, use status text
                detailedError = xhr.responseText || error;
            }

            // Log detailed error info
            console.error("Error loading PR data:", {
                status: xhr.status,
                statusText: xhr.statusText,
                error: error,
                message: errorMessage,
                details: detailedError,
                response: xhr.responseText
            });

            if (showNotification) {
                showToast(errorMessage, 'error', 2000);
            }
        },
    });
}

/**
 * Initialize PR table
 */
export function initPRTable() {
    prefix = $('[data-prefix]').data('prefix');
    
    if (!$("#table-pr").length) return;

    // Fetch data pertama kali
    fetchTableData(false);
}

/**
 * Initialize checkbox events
 */
function initCheckboxEvents() {
    // Header checkbox
    $(document).on("change", "#headerCheck", function () {
        const isChecked = $(this).prop("checked");
        // Only check/uncheck enabled checkboxes
        $(".form-checkbox").not("#headerCheck").not(":disabled").prop("checked", isChecked);
        updateDeleteButton();
    });

    // Individual checkboxes
    $(document).on("change", ".form-checkbox", function () {
        if (!$(this).is("#headerCheck")) {
            updateDeleteButton();
            
            const totalCheckboxes = $(".form-checkbox").not("#headerCheck").not(":disabled").length;
            const checkedCheckboxes = $(".form-checkbox:checked").not("#headerCheck").not(":disabled").length;
            $("#headerCheck").prop("checked", totalCheckboxes === checkedCheckboxes && totalCheckboxes > 0);
        }
    });
}

/**
 * Update delete button visibility and state
 */
function updateDeleteButton() {
    // Only count enabled checkboxes
    const checkedCount = $(".form-checkbox:checked").not("#headerCheck").not(":disabled").length;
    const deleteBtn = $("#btn-delete-selected");
    
    if (checkedCount > 1) {
        deleteBtn.removeClass("hidden").prop("disabled", false);
    } else {
        deleteBtn.addClass("hidden").prop("disabled", true);
    }
}

/**
 * Initialize edit button
 */
export function initEditButton() {
    $(document).on("click", ".btn-edit-pr", function() {
        const id = $(this).data("id");
        const editUrl = route("purchase-request.edit", { purchase_request: id });
        window.location.href = editUrl;
    });
}

/**
 * Initialize refresh button
 */
export function initRefreshButton() {
    $("#btn-refresh").on("click", function () {
        fetchTableData(true);
    });
}

/**
 * Initialize filter functionality
 */
export function initFilterControls() {
    // Toggle filter section
    $("#btn-toggle-filter").on("click", function() {
        $("#filter-section").toggleClass("hidden");
    });

    // Apply filter
    $("#btn-apply-filter").on("click", function() {
        currentFilters = {
            pr_number: $("#filter-pr-number").val(),
            item_desc: $("#filter-item-desc").val(),
            request_type: $("#filter-request-type").val(),
            location_id: $("#filter-location").val(),
            current_stage: $("#filter-stage").val(),
            classification_id: $("#filter-classification").val(),
            date_from: $("#filter-date-from").val(),
            date_to: $("#filter-date-to").val(),
        };
        
        // Remove empty filters
        Object.keys(currentFilters).forEach(key => {
            if (!currentFilters[key]) {
                delete currentFilters[key];
            }
        });

        fetchTableData(true);
    });

    // Clear filter
    $("#btn-clear-filter").on("click", function() {
        // Reset all filter inputs
        $("#filter-pr-number").val("");
        $("#filter-item-desc").val("");
        $("#filter-request-type").val("");
        $("#filter-location").val("");
        $("#filter-stage").val("");
        $("#filter-classification").val("");
        $("#filter-date-from").val("");
        $("#filter-date-to").val("");
        
        // Clear current filters but keep stat_filter if exists
        const statFilter = currentFilters.stat_filter;
        currentFilters = {};
        if (statFilter) {
            currentFilters.stat_filter = statFilter;
        }
        
        // Reload data
        fetchTableData(true);
    });

    // Initialize statistic card filters with default
    currentFilters = {
        stat_filter: 'items_without_po'
    };

    // Handle statistic card click
    $(document).on("click", ".stat-card", function() {
        const statFilter = $(this).data("stat-filter");
        
        // Remove active class from all cards
        $(".stat-card").removeClass("active").removeClass("ring-4").removeClass("ring-white/30");
        
        // Add active class to clicked card
        $(this).addClass("active").addClass("ring-4").addClass("ring-white/30");
        
        // Clear all filters except stat_filter
        $("#filter-pr-number").val("");
        $("#filter-item-desc").val("");
        $("#filter-request-type").val("");
        $("#filter-location").val("");
        $("#filter-stage").val("");
        $("#filter-classification").val("");
        $("#filter-date-from").val("");
        $("#filter-date-to").val("");
        
        // Set stat filter
        currentFilters = {
            stat_filter: statFilter
        };
        
        // Reload data
        fetchTableData(true);
    });
}

/**
 * Initialize detail modal untuk menampilkan PR detail dengan items
 */
export function initDetailModal() {
    // Setup modal close button
    $(document).on("click", "#detailPRModalClose, #detailPRModalBackdrop", function() {
        closePRDetailModal();
    });

    // Close modal when ESC key pressed
    $(document).on("keydown", function(e) {
        if (e.key === "Escape") {
            closePRDetailModal();
        }
    });

    // Handle items_count click
    $(document).on("click", ".pr-items-count", function(e) {
        e.preventDefault();
        const prId = $(this).data("pr-id");
        if (prId) {
            openPRDetailModal(prId);
        }
    });
}

/**
 * Open PR detail modal dan fetch data
 */
function openPRDetailModal(prId) {
    const modal = $("#detailPRModal");
    const backdrop = $("#detailPRModalBackdrop");
    const content = $("#detailPRModalContent");

    // Show with animation
    modal.removeClass("hidden");
    modal.css("opacity", "1");
    setTimeout(() => {
        backdrop.css("opacity", "1");
        content.css({ transform: "scale(1)", opacity: "1" });
    }, 10);

    // Fetch PR detail
    $.ajax({
        url: route("purchase-request.detail", { prefix, purchase_request: prId }),
        method: "GET",
        success: function(response) {
            populatePRDetailModal(response);
        },
        error: function(xhr) {
            console.error("Error loading PR detail:", xhr);
            showToast("Gagal memuat detail PR", "error", 2000);
            closePRDetailModal();
        }
    });
}

/**
 * Close PR detail modal
 */
function closePRDetailModal() {
    const modal = $("#detailPRModal");
    const backdrop = $("#detailPRModalBackdrop");
    const content = $("#detailPRModalContent");

    backdrop.css("opacity", "0");
    content.css({ transform: "scale(0.95)", opacity: "0" });
    modal.css("opacity", "0");
    
    setTimeout(() => {
        modal.addClass("hidden");
    }, 300);
}

/**
 * Populate PR detail modal dengan data
 */
function populatePRDetailModal(data) {
    const { pr, items } = data;

    // Populate PR info
    $("#detailPRNumber").text(pr.pr_number);
    $("#detailPRApprovedDate").text(pr.approved_date);
    $("#detailPRLocation").text(pr.location);
    $("#detailPRCreatedBy").text(pr.created_by);
    $("#detailPRCreatedAt").text(pr.created_at);
    
    // Populate request type with badge styling
    const requestTypeHtml = pr.request_type 
        ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${pr.request_type === 'barang' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'}">${pr.request_type.charAt(0).toUpperCase() + pr.request_type.slice(1)}</span>`
        : '-';
    $("#detailPRRequestType").html(requestTypeHtml);
    
    // Populate status with badge styling (highest item stage)
    const statusHtml = pr.status 
        ? pr.status 
        : '-';
    $("#detailPRStatus").html(statusHtml);
    
    $("#detailPRNotes").text(pr.notes);

    // Items count and total amount
    const itemsCount = Array.isArray(items) ? items.length : 0;
    $("#detailPRHeaderItems").html(`<i class="mgc_shopping_bag_3_line"></i> ${itemsCount} Items`);

    // Sum amounts (strip non-digits and parse)
    const parseAmountToInt = (val) => {
        if (val == null) return 0;
        const s = String(val);
        const clean = s.replace(/[^\d]/g, "");
        return clean ? parseInt(clean, 10) : 0;
    };
    const totalAmount = (items || []).reduce((sum, it) => sum + parseAmountToInt(it.amount), 0);
    const formatRupiah = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    $("#detailPRHeaderTotal").html(`<i class="mgc_wallet_3_line"></i> Total Rp ${formatRupiah(totalAmount)}`);

    // Render items grid with pagination and search
    const gridContainer = document.querySelector("#detailPRItemsGrid");
    const gridData = items.map((item, idx) => [
        idx + 1,
        `<span class=\"detail-item-desc cursor-pointer text-blue-600\">${item.item_desc}</span>`,
        item.classification
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">${item.classification}</span>`
            : '-',
        item.uom,
        item.quantity,
        `Rp ${item.unit_price}`,
        `Rp ${item.amount}`,
        item.current_stage_badge || '-',
        item.sla_pr_to_po_target ?? '-',
    ]);

    const columns = [
        { id: "number", name: "#", width: "60px" },
        { id: "item_desc", name: "Item Description", width: "250px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "classification", name: "Classification", width: "200px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "uom", name: "UOM", width: "100px" },
        { id: "quantity", name: "Quantity", width: "110px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "unit_price", name: "Unit Price", width: "140px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "amount", name: "Amount", width: "140px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "current_stage", name: "Status", width: "150px", formatter: (cell) => h("div", { innerHTML: cell }) },
        { id: "sla_pr_to_po_target", name: h("div", { className: "whitespace-normal", innerHTML: "Target SLA PR→PO" }), width: "180px", formatter: (cell) => h("div", { innerHTML: cell }) },
    ];

    if (prItemsGridInstance) {
        prItemsGridInstance.updateConfig({ data: gridData, columns, pagination: { limit: 10 }, search: true }).forceRender();
    } else {
        prItemsGridInstance = new Grid({
            columns,
            data: gridData,
            pagination: { limit: 10 },
            search: true,
        });
        prItemsGridInstance.render(gridContainer);
    }
}
