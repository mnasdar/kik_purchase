/**
 * Modul Classification - Read
 * Mengelola tabel dan tampilan data klasifikasi
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showToast } from "../../../core/notification.js";

let actionTippyInstances = [];

/**
 * Inisialisasi tabel klasifikasi
 */
export function initClassificationsTable() {
    if (!$("#table-classifications").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "name",
            name: "Nama Klasifikasi",
            width: "250px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "purchase_request_items_count",
            name: "PR Items",
            width: "130px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "created_at",
            name: "Dibuat",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "actions",
            name: "Actions",
            width: "120px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];

    const buttonConfig = [
        { selector: "#btn-delete-selected", when: "multiple" },
    ];

    initGridTable({
        tableId: "#table-classifications",
        dataUrl: route("klasifikasi.data"),
        columns: columns,
        enableCheckbox: true,
        buttonConfig: buttonConfig,
        limit: 10,
        enableFilter: false,
        onDataLoaded: (data) => {
            $("#data-count").text(data.length);
            initActionTooltips();
            initPRItemsButtonHandlers();
        },
    });
}

/**
 * Init tooltips for action buttons
 */
function initActionTooltips() {
    actionTippyInstances.forEach((inst) => inst.destroy());
    actionTippyInstances = [];

    const targets = document.querySelectorAll('#table-classifications [data-plugin="tippy"]');
    if (targets.length) {
        actionTippyInstances = tippy(targets, { arrow: true });
    }
}

/**
 * Init PR items button click handlers
 */
function initPRItemsButtonHandlers() {
    $(document).on('click', '.btn-view-pr-items', function(e) {
        e.preventDefault();
        const classificationId = $(this).data('classification-id');
        const classificationName = $(this).data('classification-name');
        
        if (classificationId) {
            // Navigate to PR items page
            window.location.href = route('klasifikasi.pr-items', classificationId);
        }
    });
}

/**
 * Refresh table data
 */
function refreshTable() {
    const grid = $("#table-classifications").data('grid');
    if (!grid) return;

    showToast('Memuat data...', 'info', 1000);

    $.ajax({
        url: route("klasifikasi.data"),
        method: "GET",
        success: function (data) {
            // Rebuild data for grid
            const gridData = data.map((item) => [
                item.checkbox,
                item.number,
                item.type,
                item.name,
                item.purchase_request_items_count,
                item.created_at,
                item.actions,
            ]);

            // Update grid
            grid.updateConfig({
                data: gridData,
            }).forceRender();

            // Update count
            $("#data-count").text(data.length);

            // Reinit tooltips
            setTimeout(() => {
                initActionTooltips();
                initPRItemsButtonHandlers();
            }, 300);

            showToast('Data berhasil direfresh', 'success', 1500);
        },
        error: function (xhr) {
            console.error("Error loading data:", xhr);
            showToast('Gagal memuat data', 'error', 2000);
        },
    });
}

/**
 * Refresh button
 */
export function initRefreshButton() {
    $("#btn-refresh").on("click", function () {
        refreshTable();
    });
}
