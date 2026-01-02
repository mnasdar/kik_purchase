/**
 * Modul Roles - Read & Display
 * Mengelola tabel roles dan tampilan data
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showToast } from "../../../core/notification.js";

let actionTippyInstances = [];

/**
 * Inisialisasi tabel roles
 */
function initRolesTable() {
    if (!$("#table-roles").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "name",
            name: "Role Name",
            width: "500px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "permissions_count",
            name: "Permissions",
            width: "200px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "users_count",
            name: "Users",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "actions",
            name: "Actions",
            width: "100px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];

    const buttonConfig = [
        { selector: ".btn-edit", when: "one" },
        { selector: ".btn-delete", when: "one" },
    ];

    initGridTable({
        tableId: "#table-roles",
        dataUrl: route("roles.data"),
        columns: columns,
        enableCheckbox: false,
        buttonConfig: buttonConfig,
        limit: 10,
        enableFilter: false,
        onDataLoaded: () => {
            initActionTooltips();
        },
    });
}

/**
 * Init tooltips for action buttons
 */
function initActionTooltips() {
    // Destroy previous instances to avoid duplicates
    actionTippyInstances.forEach((inst) => inst.destroy());
    actionTippyInstances = [];

    // Initialize tooltips for dynamically loaded buttons
    const targets = document.querySelectorAll('#table-roles [data-plugin="tippy"]');
    if (targets.length) {
        actionTippyInstances = tippy(targets);
    }
}

/**
 * Refresh table data
 */
function refreshTable() {
    const grid = $("#table-roles").data('grid');
    if (!grid) return;

    showToast('Memuat data...', 'info', 1000);

    $.ajax({
        url: route("roles.data"),
        method: "GET",
        success: function (data) {
            const gridData = data.map((item) => [
                item.number,
                item.name,
                item.permissions_count,
                item.users_count,
                item.actions,
            ]);

            grid.updateConfig({
                data: gridData,
            }).forceRender();

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
$("#btn-refresh").off("click").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    refreshTable();
});

// Initialize
$(document).ready(function () {
    initRolesTable();
});
