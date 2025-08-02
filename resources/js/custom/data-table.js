import $ from "jquery";
import { Grid, h, html } from "gridjs";
import { route } from "ziggy-js";

// Fungsi untuk menginisialisasi tabel Grid.js
function initGridTable({
    tableId,        // ID kontainer tabel
    gridData,       // Data array yang ditampilkan di tabel
    columns,        // Struktur kolom Grid.js
    limit = 10,     // Jumlah data per halaman
    delay = 300,    // Waktu tunggu sebelum render
    buttonConfig = [], // Konfigurasi tombol berdasarkan jumlah data yang dipilih
}) {
    if (!$(tableId).length) return;

    const headerCheckId = `headerCheck-${tableId.replace('#', '')}`;
    const container = document.querySelector(tableId);

    // Inisialisasi Grid.js
    new Grid({
        columns: [
            {
                id: "Checkbox",
                name: html(`<div class="form-check"><input type="checkbox" class="form-checkbox rounded text-primary header-checkbox" id="${headerCheckId}"></div>`),
                width: "50px",
                sort: false,
                formatter: cell => h("div", { innerHTML: cell })
            },
            ...columns
        ],
        pagination: { limit },
        search: true,
        sort: true,
        data: () => new Promise(resolve => setTimeout(() => resolve(gridData), 200)),
    }).render(container);

    // Delay agar Grid sudah ter-render
    setTimeout(() => {
        const selector = `${tableId} input[type="checkbox"]`;

        // Checkbox header untuk memilih semua
        $(document).on('change', `#${headerCheckId}`, function () {
            const isChecked = $(this).is(':checked');
            $(`${selector}`).not(this).prop('checked', isChecked).trigger('change');
        });

        // Checkbox baris individu
        $(document).on('change', `${selector}:not(#${headerCheckId})`, function () {
            const checkboxes = $(`${selector}:not(#${headerCheckId})`);
            const checked = checkboxes.filter(':checked');

            // Sinkronkan header checkbox
            $(`#${headerCheckId}`).prop('checked', checkboxes.length === checked.length);

            // Konfigurasi tombol berdasarkan jumlah yang dicentang
            buttonConfig.forEach(btn => {
                const el = $(btn.selector);
                if (!el.length) return;

                let enable = false;
                switch (btn.when) {
                    case 'one':
                        enable = checked.length === 1;
                        break;
                    case 'multiple':
                        enable = checked.length > 1;
                        break;
                    case 'any':
                        enable = checked.length > 0;
                        break;
                }

                el.prop('disabled', !enable);
                checked.length === 0 ? el.hide() : el.show();
            });
        });
    }, delay);

    // Sembunyikan dan disable semua tombol saat pertama kali load
    buttonConfig.forEach(btn => {
        const el = $(btn.selector);
        if (el.length) el.prop('disabled', true).hide();
    });
}

// Fungsi untuk tombol edit: redirect ke halaman edit berdasarkan ID dari checkbox
function setEditButton({ routeEditName }) {
    $(document).on('click', '.btn-edit', function () {
        const checked = $(`input[type="checkbox"]:not([id^="headerCheck"]):checked`);
        if (checked.length === 1) {
            const id = checked.val();
            const url = route(routeEditName, id);
            window.location.href = url;
        }
    });
}

// === Eksekusi saat halaman siap ===
$(function () {
    // TABEL PURCHASE REQUEST
    if ($("#purchase_request-table").length) {
        initGridTable({
            tableId: "#purchase_request-table",
            gridData: Data.map(item => [
                item.checkbox, item.number, item.status, item.classification, item.pr_number,
                item.location, item.item_desc, item.uom, item.approved_date,
                item.unit_price, item.qty, item.amount, item.sla
            ]),
            columns: [
                { name: "#", width: "60px" },
                { name: "Status", width: "130px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Classification", width: "200px" },
                { name: "PR Number", width: "180px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Location", width: "150px" },
                { name: "Item Desc", width: "200px" },
                { name: "UOM", width: "100px" },
                { name: "Date", width: "120px" },
                { name: "Unit Price", width: "200px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Qty", width: "90px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Amount", width: "200px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "SLA", width: "100px", formatter: cell => h("div", { innerHTML: cell }) }
            ],
            buttonConfig: [
                { selector: ".btn-edit", when: "one" },
                { selector: ".btn-delete", when: "any" }
            ]
        });

        setEditButton({ routeEditName: "purchase-request.edit" });
    }

    // TABEL PURCHASE ORDER
    if ($("#purchase_order-table").length) {
        initGridTable({
            tableId: "#purchase_order-table",
            gridData: Data.map(item => [
                item.checkbox, item.number, item.pr_number, item.status, item.po_number,
                item.approved_date, item.supplier_name, item.qty, item.unit_price,
                item.amount, item.sla
            ]),
            columns: [
                { name: "#", width: "60px" },
                { name: "PR", width: "80px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Status", width: "130px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "PO Number", width: "180px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Date", width: "120px" },
                { name: "Supplier Name", width: "200px" },
                { name: "Qty", width: "90px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Unit Price", width: "200px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Amount", width: "200px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "SLA", width: "100px", formatter: cell => h("div", { innerHTML: cell }) }
            ],
            buttonConfig: [
                { selector: ".btn-edit", when: "one" },
                { selector: ".btn-delete", when: "any" },
                { selector: ".btn-linktopr", when: "one" }
            ]
        });

        setEditButton({ routeEditName: "purchase-order.edit" });
    }

    // TABEL ONSITE
    if ($("#onsite-table").length) {
        initGridTable({
            tableId: "#onsite-table",
            gridData: Data.map(item => [
                item.checkbox, item.number,item.tgl_terima, item.status, item.po_number, item.approved_date,
                item.supplier_name, item.qty, item.unit_price, item.amount, item.sla
            ]),
            columns: [
                { name: "#", width: "60px" },
                { name: "Tgl Terima PO", width: "150px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Status", width: "130px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "PO Number", width: "180px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Date", width: "120px" },
                { name: "Supplier Name", width: "200px" },
                { name: "Qty", width: "90px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Unit Price", width: "200px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Amount", width: "200px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "SLA", width: "100px", formatter: cell => h("div", { innerHTML: cell }) }
            ],
            buttonConfig: [
                { selector: ".btn-edit", when: "one" },
                { selector: ".btn-delete", when: "any" },
                { selector: ".btn-onsite", when: "any" }
            ]
        });
    }

    // TABEL STATUS
    if ($("#status-table").length) {
        initGridTable({
            tableId: "#status-table",
            gridData: Data.map(item => [
                item.checkbox, item.number,item.type, item.name
            ]),
            columns: [
                { name: "#", width: "60px" },
                { name: "Type", width: "300px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Name", width: "600px", formatter: cell => h("div", { innerHTML: cell }) },
            ],
            buttonConfig: [
                { selector: ".btn-edit", when: "one" },
                { selector: ".btn-delete", when: "any" },
                { selector: ".btn-onsite", when: "any" }
            ]
        });
    }

    // TABEL CLASSIFICATION
    if ($("#classification-table").length) {
        initGridTable({
            tableId: "#classification-table",
            gridData: Data.map(item => [
                item.checkbox, item.number,item.type, item.name,item.sla,
            ]),
            columns: [
                { name: "#", width: "60px" },
                { name: "Type", width: "300px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Name", width: "400px", formatter: cell => h("div", { innerHTML: cell }) },
                { name: "SLA", width: "200px", formatter: cell => h("div", { innerHTML: cell }) },
            ],
            buttonConfig: [
                { selector: ".btn-edit", when: "one" },
                { selector: ".btn-delete", when: "any" },
                { selector: ".btn-onsite", when: "any" }
            ]
        });
    }
});
