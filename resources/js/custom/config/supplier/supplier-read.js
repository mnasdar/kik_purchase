/**
 * Modul Supplier - Read
 * Mengelola tabel dan tampilan data supplier
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showToast } from "../../../core/notification.js";

let actionTippyInstances = [];

/**
 * Inisialisasi tabel supplier
 */
export function initSuppliersTable() {
    if (!$("#table-suppliers").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "supplier_type",
            name: "Type",
            width: "100px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "name",
            name: "Nama Supplier",
            width: "200px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "contact_person",
            name: "Contact Person",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "phone",
            name: "Telepon",
            width: "140px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "email",
            name: "Email",
            width: "200px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "created_by",
            name: "Created By",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "npwp",
            name: "NPWP",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "actions",
            name: "Actions",
            width: "80px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];

    const buttonConfig = [
        { selector: "#btn-delete-selected", when: "multiple" },
    ];

    initGridTable({
        tableId: "#table-suppliers",
        dataUrl: route("supplier.data"),
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

    const targets = document.querySelectorAll('#table-suppliers [data-plugin="tippy"]');
    if (targets.length) {
        actionTippyInstances = tippy(targets);
    }
}

/**
 * Refresh table data
 */
function refreshTable() {
    const grid = $("#table-suppliers").data('grid');
    if (!grid) return;

    showToast('Memuat data...', 'info', 1000);

    $.ajax({
        url: route("supplier.data"),
        method: "GET",
        success: function (data) {
            // Rebuild data for grid
            const gridData = data.map((item) => [
                item.checkbox,
                item.number,
                item.supplier_type,
                item.name,
                item.contact_person,
                item.phone,
                item.email,
                item.created_by,
                item.npwp,
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
