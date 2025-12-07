/**
 * Modul Purchase Request - Table
 * Mengelola tabel purchase request dengan Grid.js
 *
 * @module modules/purchase-request/purchase-request-read
 */

import { initGridTable, setEditButton } from "../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";

// State management
const state = {
    prefix: null,
    gridInstance: null,
};

/**
 * Inisialisasi tabel purchase request
 */
function initPRTable() {
    // Get prefix from URL or data attribute
    state.prefix = $('[data-prefix]').data('prefix') || document.body.dataset.prefix;
    
    if (!$("#table-pr").length) return;

    // Konfigurasi kolom tabel
    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "pr_number",
            name: "PR Number",
            width: "150px",
            formatter: (cell) =>
                h("div", {
                    innerHTML: cell,
                }),
        },
        {
            id: "classification",
            name: "Classification",
            width: "150px",
            formatter: (cell) =>
                h("div", {
                    innerHTML: cell,
                }),
        },
        {
            id: "location",
            name: "Location",
            width: "120px",
        },
        {
            id: "item_description",
            name: "Item Description",
            width: "200px",
        },
        {
            id: "uom",
            name: "UOM",
            width: "80px",
        },
        {
            id: "quantity",
            name: "Qty",
            width: "80px",
            formatter: (cell) =>
                h("div", {
                    innerHTML: cell,
                }),
        },
        {
            id: "unit_price",
            name: "Unit Price",
            width: "150px",
            formatter: (cell) =>
                h("div", {
                    innerHTML: cell,
                }),
        },
        {
            id: "amount",
            name: "Amount",
            width: "150px",
            formatter: (cell) =>
                h("div", {
                    innerHTML: cell,
                }),
        },
        {
            id: "status",
            name: "Status",
            width: "120px",
            formatter: (cell) =>
                h("div", {
                    innerHTML: cell,
                }),
        },
        {
            id: "approved_date",
            name: "Approved Date",
            width: "150px",
        },
    ];

    // Konfigurasi tombol
    const buttonConfig = [
        { selector: ".btn-edit", when: "one" },
        { selector: ".btn-delete", when: "any" },
    ];

    // Inisialisasi Grid.js table
    initGridTable({
        tableId: "#table-pr",
        dataUrl: route("purchase-request.data", { prefix: state.prefix }),
        columns: columns,
        buttonConfig: buttonConfig,
        limit: 10,
    });

    // Setup tombol edit
    setEditButton({
        routeEditName: "purchase-request.edit",
        routeParams: { prefix: state.prefix },
    });

    // Muat statistik PR
    loadPRStats();
}

// Inisialisasi
initPRTable();

// ------- Statistik Purchase Request -------
function extractText(html) {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").trim();
}

function parseIntSafe(val) {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
        const digits = val.replace(/[^\d-]/g, "");
        return digits ? parseInt(digits, 10) : 0;
    }
    return 0;
}

function loadPRStats() {
    const url = route("purchase-request.data", { prefix: state.prefix });
    $.getJSON(url)
        .done(function (data) {
            if (!Array.isArray(data)) return;
            const total = data.length;
            let finished = 0;
            let onProcess = 0;
            let totalSLA = 0;
            let slaCount = 0;

            data.forEach((row) => {
                const statusText = extractText(row.status);
                if (statusText.toLowerCase().includes("finish")) {
                    finished += 1;
                } else if (statusText.toLowerCase().includes("process")) {
                    onProcess += 1;
                }

                // Calculate SLA days if approved_date exists
                if (row.approved_date) {
                    const approvedDate = new Date(row.approved_date);
                    const today = new Date();
                    const daysElapsed = Math.floor((today - approvedDate) / (1000 * 60 * 60 * 24));
                    if (!Number.isNaN(daysElapsed)) {
                        totalSLA += daysElapsed;
                        slaCount += 1;
                    }
                }
            });

            $("#total-pr").text(total);
            $("#pr-finished").text(finished);
            $("#pr-on-process").text(onProcess);
            const avgSLA = slaCount > 0 ? Math.round(totalSLA / slaCount) : 0;
            $("#avg-sla-days").text(avgSLA);
        })
        .fail(function () {
            $("#total-pr, #pr-finished, #pr-on-process").text(0);
            $("#avg-sla-days").text(0);
        });
}

export { initPRTable, loadPRStats };
