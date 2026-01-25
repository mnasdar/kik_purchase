/**
 * Modul Classification PR Items - View
 * Menampilkan daftar PR items berdasarkan klasifikasi
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import { showToast } from "../../../core/notification.js";

// Helper to render table row; allow HTML value when flagged
const tableRow = (label, value, isHtml = false) => `
    <tr class="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">${label}</td>
        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${isHtml ? value : value}</td>
    </tr>
`;

// Format currency tanpa Rp prefix
const formatCurrency = (val) => (val || val === 0) ? Number(val).toLocaleString('id-ID') : '-';

// Format number
const formatNumber = (val) => val || val === 0 ? Number(val).toLocaleString('id-ID') : '-';

// Format date to DD-MMM-YY
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
};

// Calculate SLA percentage: if realization > target = 0%, else = 100%
const calcSLAPercent = (target, realization) => {
    if (!target || !realization) return '-';
    return Number(realization) > Number(target) ? '0%' : '100%';
};

/**
 * Inisialisasi tabel PR items
 */
function initPRItemsTable() {
    if (!$("#table-pr-items").length) return;

    const classificationId = window.classificationData?.id;
    if (!classificationId) {
        showToast('Classification ID tidak ditemukan', 'error');
        return;
    }

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "po_number",
            name: "PO Number",
            width: "140px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "location",
            name: "Lokasi",
            width: "140px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "item_description",
            name: "Item Description",
            width: "300px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "quantity",
            name: "Qty",
            width: "120px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "unit_price",
            name: "Unit Price",
            width: "140px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "amount",
            name: "Amount",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "status",
            name: "Status",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "created_by",
            name: "Created By",
            width: "140px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];

    initGridTable({
        tableId: "#table-pr-items",
        dataUrl: route("klasifikasi.pr-items.data", classificationId),
        columns: columns,
        enableCheckbox: false,
        buttonConfig: [],
        limit: 10,
        enableFilter: false,
        onDataLoaded: (data) => {
            $("#data-count").text(data.length);
        },
    });
}

/**
 * Refresh table data
 */
function refreshTable() {
    const grid = $("#table-pr-items").data('grid');
    if (!grid) return;

    const classificationId = window.classificationData?.id;
    if (!classificationId) return;

    showToast('Memuat data...', 'info', 1000);

    $.ajax({
        url: route("klasifikasi.pr-items.data", classificationId),
        method: "GET",
        success: function (data) {
            // Rebuild data for grid
            const gridData = data.map((item) => [
                item.number,
                item.po_number,
                item.location,
                item.item_description,
                item.quantity,
                item.unit_price,
                item.amount,
                item.status,
                item.created_by,
            ]);

            // Update grid
            grid.updateConfig({
                data: gridData,
            }).forceRender();

            // Update count
            $("#data-count").text(data.length);

            showToast('Data berhasil direfresh', 'success', 1500);
        },
        error: function (xhr) {
            console.error("Error loading data:", xhr);
            showToast('Gagal memuat data', 'error', 2000);
        },
    });
}

/**
 * Init refresh button
 */
function initRefreshButton() {
    $("#btn-refresh").on("click", function () {
        refreshTable();
    });
}

/**
 * PR detail modal handlers
 */
function bindPRDetailHandler() {
    $(document).on('click', '.btn-pr-detail', function (e) {
        e.preventDefault();
        const prId = $(this).data('pr-id');
        const classificationId = window.classificationData?.id;
        if (!prId || !classificationId) return;
        fetchPRDetail(classificationId, prId);
    });

    $('#prDetailClose, #prDetailBackdrop').on('click', function () {
        hidePRDetailModal();
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && !$('#prDetailModal').hasClass('hidden')) {
            hidePRDetailModal();
        }
    });
}

function fetchPRDetail(classificationId, prId) {
    showPRDetailModal('<div class="text-center text-slate-500 dark:text-slate-400">Memuat data...</div>');
    $.ajax({
        url: route('klasifikasi.pr-items.detail', [classificationId, prId]),
        method: 'GET',
        success: function (response) {
            renderPRDetail(response);
        },
        error: function () {
            showPRDetailModal('<div class="text-center text-red-500">Gagal memuat data</div>');
        }
    });
}

function renderPRDetail(data) {
    if (!data || !data.pr) {
        showPRDetailModal('<div class="text-center text-red-500">Data tidak ditemukan</div>');
        return;
    }

    const itemTables = (data.items || []).map((item, idx) => {
        const stageBadge = `<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${item.stage_color ?? ''}">${item.stage_label ?? '-'}</span>`;
        const slaPoPercent = calcSLAPercent(item.sla_pr_to_po_target, item.sla_pr_to_po_realization);
        const slaPoColor = slaPoPercent === '100%' ? 'text-green-600 dark:text-green-400' : slaPoPercent === '0%' ? 'text-red-600 dark:text-red-400' : '';
        
        const slaOnsitePercent = calcSLAPercent(item.sla_po_to_onsite_target, item.sla_po_to_onsite_realization);
        const slaOnsiteColor = slaOnsitePercent === '100%' ? 'text-green-600 dark:text-green-400' : slaOnsitePercent === '0%' ? 'text-red-600 dark:text-red-400' : '';
        
        const slaOnsiteSubmitPercent = calcSLAPercent(item.sla_onsite_to_submit_target, item.sla_onsite_to_submit_realization);
        const slaOnsiteSubmitColor = slaOnsiteSubmitPercent === '100%' ? 'text-green-600 dark:text-green-400' : slaOnsiteSubmitPercent === '0%' ? 'text-red-600 dark:text-red-400' : '';
        
        const slaInvoicePercent = calcSLAPercent(item.sla_invoice_to_finance_target, item.sla_invoice_to_finance_realization);
        const slaInvoiceColor = slaInvoicePercent === '100%' ? 'text-green-600 dark:text-green-400' : slaInvoicePercent === '0%' ? 'text-red-600 dark:text-red-400' : '';

        return `
            <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <table class="w-full text-sm">
                    <tbody>
                        <tr class="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-slate-800 dark:text-slate-100">Item ${idx + 1}: ${item.item_desc ?? '-'}</td>
                        </tr>
                        <tr class="bg-blue-50/30 dark:bg-blue-950/20 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">\uD83D\uDCCB PURCHASE REQUEST</td>
                        </tr>
                        ${tableRow('Classification', item.classification ?? '-')}
                        ${tableRow('Stage', stageBadge, true)}
                        ${tableRow('Qty', formatNumber(item.quantity))}
                        ${tableRow('UOM', item.uom ?? '-')}
                        ${tableRow('PR Unit Price', formatCurrency(item.pr_unit_price))}
                        ${tableRow('PR Amount', formatCurrency(item.pr_amount))}

                        <tr class="bg-amber-50/30 dark:bg-amber-950/20 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-amber-700 dark:text-amber-300">\uD83D\uDED2 PURCHASE ORDER</td>
                        </tr>
                        ${tableRow('PO Number', item.po_number ?? '-')}
                        ${tableRow('Supplier', item.po_supplier ?? '-')}
                        ${tableRow('PO Qty', formatNumber(item.po_quantity))}
                        ${tableRow('PO Unit Price', formatCurrency(item.po_unit_price))}
                        ${tableRow('PO Amount', formatCurrency(item.po_amount))}
                        ${tableRow('Cost Saving', formatCurrency(item.cost_saving))}
                        ${tableRow('SLA PR→PO Target', item.sla_pr_to_po_target ?? '-')}
                        ${tableRow('SLA PR→PO Realisasi', item.sla_pr_to_po_realization ?? '-')}
                        ${tableRow('SLA PR→PO %', `<span class="font-bold ${slaPoColor}">${slaPoPercent}</span>`, true)}

                        <tr class="bg-red-50/30 dark:bg-red-950/20 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-red-700 dark:text-red-300">\uD83D\uDCCD ONSITE</td>
                        </tr>
                        ${tableRow('Onsite Date', formatDate(item.onsite_date))}
                        ${tableRow('SLA PO→Onsite Target', item.sla_po_to_onsite_target ?? '-')}
                        ${tableRow('SLA PO→Onsite Real', item.sla_po_to_onsite_realization ?? '-')}
                        ${tableRow('SLA PO→Onsite %', `<span class="font-bold ${slaOnsiteColor}">${slaOnsitePercent}</span>`, true)}

                        <tr class="bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-emerald-700 dark:text-emerald-300">\uD83D\uDCBC INVOICE</td>
                        </tr>
                        ${tableRow('Invoice Number', item.invoice_number ?? '-')}
                        ${tableRow('Invoice Received', formatDate(item.invoice_received_at))}
                        ${tableRow('Invoice Submitted', formatDate(item.invoice_submitted_at))}
                        ${tableRow('SLA Inv→Finance Target', item.sla_invoice_to_finance_target ?? '-')}
                        ${tableRow('SLA Inv→Finance Real', item.sla_invoice_to_finance_realization ?? '-')}
                        ${tableRow('SLA Inv→Finance %', `<span class="font-bold ${slaInvoiceColor}">${slaInvoicePercent}</span>`, true)}

                        <tr class="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-slate-700 dark:text-slate-200">\uD83D\uDCB3 PAYMENT</td>
                        </tr>
                        ${tableRow('Payment Number', item.payment_number ?? '-')}
                        ${tableRow('Payment Date', formatDate(item.payment_date))}
                        ${tableRow('SLA Payment Real', item.sla_payment_realization ?? '-')}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');

    const metaTable = `
        <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mb-4">
            <table class="w-full text-sm">
                <tbody>
                    <tr class="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                        <td colspan="2" class="px-4 py-2 font-bold text-slate-800 dark:text-slate-100">\u2139\uFE0F PR INFO</td>
                    </tr>
                    ${tableRow('Request Type', data.pr.request_type ?? '-')}
                    ${tableRow('Location', data.pr.location ?? '-')}
                    ${tableRow('Approved Date', formatDate(data.pr.approved_date))}
                    ${tableRow('Created By', data.pr.created_by ?? '-')}
                    ${tableRow('Notes', data.pr.notes ?? '-')}    
                </tbody>
            </table>
        </div>
    `;

    const body = `
        <div class="space-y-4">
            ${metaTable}
            ${itemTables || '<p class="text-sm text-slate-500">Tidak ada item</p>'}
        </div>
    `;

    $('#prDetailTitle').text(`PR ${data.pr.number}`);
    showPRDetailModal(body);
}

function showPRDetailModal(contentHtml) {
    $('#prDetailBody').html(contentHtml);
    const modal = $('#prDetailModal');
    const backdrop = $('#prDetailBackdrop');
    const content = $('#prDetailContent');

    modal.removeClass('hidden').css({ 'opacity': 1, 'pointer-events': 'auto' });
    setTimeout(() => {
        backdrop.css('opacity', 1);
        content.css({ opacity: 1, transform: 'scale(1)' });
    }, 10);
}

function hidePRDetailModal() {
    const modal = $('#prDetailModal');
    const backdrop = $('#prDetailBackdrop');
    const content = $('#prDetailContent');

    backdrop.css('opacity', 0);
    content.css({ opacity: 0, transform: 'scale(0.95)' });
    setTimeout(() => {
        modal.addClass('hidden').css({ 'opacity': 0, 'pointer-events': 'none' });
    }, 300);
}

/**
 * Initialize all modules
 */
$(document).ready(function () {
    initPRItemsTable();
    initRefreshButton();
    bindPRDetailHandler();
});
