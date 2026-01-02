/**
 * Modul log akses - Tabel
 * Mengelola tabel log dengan Grid.js dan statistik
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import { showToast } from "../../../core/notification.js";

/**
 * Update statistik di cards
 */
function updateStatistics(data) {
    let totalLogs = data.length;
    let createLogs = 0;
    let updateLogs = 0;
    let deleteLogs = 0;

    data.forEach(log => {
        const desc = log.description.toLowerCase();
        if (desc.includes('menambahkan') || desc.includes('membuat') || desc.includes('create')) {
            createLogs++;
        } else if (desc.includes('mengedit') || desc.includes('mengupdate') || desc.includes('update') || desc.includes('memperbarui')) {
            updateLogs++;
        } else if (desc.includes('menghapus') || desc.includes('delete')) {
            deleteLogs++;
        }
    });

    // Animate count up
    animateValue('total-logs', 0, totalLogs, 500);
    animateValue('create-logs', 0, createLogs, 500);
    animateValue('update-logs', 0, updateLogs, 500);
    animateValue('delete-logs', 0, deleteLogs, 500);
}

/**
 * Animate number count up
 */
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/**
 * Inisialisasi tabel log
 */
function initlogTable() {
    if (!$("#table-log").length) return;

    const columns = [
        { id: "number", name: "#", width: "60px" },
        {
            id: "causer",
            name: "User",
            width: "150px",
            formatter: (cell) =>
                h("div", {
                    className: "flex items-center gap-2",
                    innerHTML: `
                        <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <i class="mgc_user_3_line text-primary-600 dark:text-primary-400"></i>
                        </div>
                        <span class="font-medium text-gray-800 dark:text-white">${cell}</span>
                    `,
                }),
        },
        {
            id: "description",
            name: "Deskripsi",
            width: "600px",
            formatter: (cell) =>
                h("div", {
                    innerHTML: cell,
                }),
        },
        {
            id: "created_at",
            name: "Waktu",
            width: "170px",
            formatter: (cell) =>
                h("div", {
                    className: "flex items-center gap-2 text-sm",
                    innerHTML: `
                        <i class="mgc_time_line text-gray-400"></i>
                        <span>${cell}</span>
                    `,
                }),
        },
    ];

    const buttonConfig = [];

    initGridTable({
        tableId: "#table-log",
        dataUrl: route("log.data"),
        columns: columns,
        buttonConfig: buttonConfig,
        limit: 10,
        enableFilter: false,
        enableCheckbox: false,
        onDataLoaded: (data) => {
            updateStatistics(data);
        }
    });
}

/**
 * Refresh table data
 */
function refreshTable() {
    const grid = $("#table-log").data('grid');
    if (!grid) return;

    showToast('Memuat data...', 'info', 1000);

    $.ajax({
        url: route("log.data"),
        method: "GET",
        success: function (data) {
            updateStatistics(data);

            const gridData = data.map((item) => [
                item.number,
                item.causer,
                item.description,
                item.created_at,
            ]);

            grid.updateConfig({
                data: gridData,
            }).forceRender();

            showToast('Data berhasil direfresh', 'success', 1500);
        },
        error: function (xhr) {
            console.error("Error loading data:", xhr);
            showToast('Gagal memuat data', 'error', 2000);
        },
    });
}

/**
 * Refresh button handler
 */
$("#btn-refresh").off("click").on("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    refreshTable();
});

// Inisialisasi
$(document).ready(function() {
    initlogTable();
});
