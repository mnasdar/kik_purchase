/**
 * Modul Location - Read
 * Mengelola tabel dan tampilan data unit kerja
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showToast } from "../../../core/notification.js";

let actionTippyInstances = [];

/**
 * Inisialisasi tabel unit kerja
 */
export function initLocationsTable() {
    if (!$("#table-locations").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "name",
            name: "Nama Unit Kerja",
            width: "300px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "users_count",
            name: "Users",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "purchase_requests_count",
            name: "Purchase Requests",
            width: "180px",
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
        tableId: "#table-locations",
        dataUrl: route("unit-kerja.data"),
        columns: columns,
        enableCheckbox: true,
        buttonConfig: buttonConfig,
        limit: 10,
        enableFilter: false,
        onDataLoaded: (data) => {
            $("#data-count").text(data.length);
            initActionTooltips();
        },
    });
}

/**
 * Init tooltips for action buttons
 */
function initActionTooltips() {
    actionTippyInstances.forEach((inst) => inst.destroy());
    actionTippyInstances = [];

    const targets = document.querySelectorAll('#table-locations [data-plugin="tippy"]');
    if (targets.length) {
        actionTippyInstances = tippy(targets);
    }
}

/**
 * Refresh table data
 */
function refreshTable() {
    const grid = $("#table-locations").data('grid');
    if (!grid) return;

    showToast('Memuat data...', 'info', 1000);

    $.ajax({
        url: route("unit-kerja.data"),
        method: "GET",
        success: function (data) {
            // Rebuild data for grid
            const gridData = data.map((item) => [
                item.checkbox,
                item.number,
                item.name,
                item.users_count,
                item.purchase_requests_count,
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
