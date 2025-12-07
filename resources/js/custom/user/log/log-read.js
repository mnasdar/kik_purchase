/**
 * Modul log - Table
 * Mengelola tabel log dengan Grid.js dan statistik
 *
 * @module modules/log/log-table
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";

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
    // Cek apakah element table ada
    if (!$("#table-log").length) return;

    // Konfigurasi kolom tabel
    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
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

    // Konfigurasi tombol yang akan di-enable/disable berdasarkan checkbox
    const buttonConfig = [];

    // Inisialisasi Grid.js table
    initGridTable({
        tableId: "#table-log",
        dataUrl: route("log.data"),
        columns: columns,
        buttonConfig: buttonConfig,
        limit: 10,
        enableFilter: false,
        enableCheckbox: false,
        onDataLoaded: (data) => {
            // Update statistik setelah data loaded
            updateStatistics(data);
        }
    });
}

/**
 * Refresh button handler
 */
$("#btn-refresh").on("click", function() {
    const btn = $(this);
    const icon = btn.find("i");
    
    // Disable button dan animate icon
    btn.prop("disabled", true);
    icon.addClass("animate-spin");
    
    // Reload page after short delay
    setTimeout(() => {
        location.reload();
    }, 500);
});

// Inisialisasi
$(document).ready(function() {
    initlogTable();
});
