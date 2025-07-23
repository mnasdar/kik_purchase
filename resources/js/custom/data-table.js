import {
    Grid,
    h,
    html
} from "gridjs";
import $ from "jquery";
import {
    route
} from "ziggy-js";

function initGridTable({
    tableId,
    gridData,
    columns,
    limit = 10,
    delay = 300,
    buttonConfig = [], // Tambahan konfigurasi tombol
}) {
    if (!$(tableId).length) return;

    const headerCheckId = `headerCheck-${tableId.replace('#', '')}`;
    const container = document.querySelector(tableId);

    // Inject Grid.js
    new Grid({
        columns: [{
                id: "Checkbox",
                name: html(`<div class="form-check"><input type="checkbox" class="form-checkbox rounded text-primary" id="${headerCheckId}"></div>`),
                width: "50px",
                sort: false,
                formatter: cell => h("div", {
                    innerHTML: cell
                })
            },
            ...columns
        ],
        pagination: {
            limit
        },
        search: true,
        sort: true,
        data: () => new Promise(resolve => setTimeout(() => resolve(gridData), 200)),
    }).render(container);

    // Delay to allow DOM render
    setTimeout(() => {
        const selector = `${tableId} input[type="checkbox"]`;

        // Header checkbox event
        $(document).on('change', `#${headerCheckId}`, function () {
            const isChecked = $(this).is(':checked');
            $(`${selector}`).not(this).prop('checked', isChecked).trigger('change');
        });

        // Row checkbox event (REUSABLE)
        $(document).on('change', `${selector}:not(#${headerCheckId})`, function () {
            const checkboxes = $(`${selector}:not(#${headerCheckId})`);
            const checked = checkboxes.filter(':checked');

            // Sinkronkan status header checkbox
            $(`#${headerCheckId}`).prop('checked', checkboxes.length === checked.length);

            // Proses konfigurasi tombol
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
                    default:
                        enable = false;
                }

                el.prop('disabled', !enable);
                // ✅ Jika tidak ada data yang diceklis, SEMBUNYIKAN semua tombol dalam buttonConfig
                if (checked.length === 0) {
                    buttonConfig.forEach(btn => {
                        $(btn.selector).hide();
                    });
                } else {
                    // Jika ada yang diceklis, TAMPILKAN kembali tombol yang relevan
                    buttonConfig.forEach(btn => {
                        $(btn.selector).show();
                    });

                    // 🔍 Cek apakah semua data yang dicentang sudah memiliki barcode
                    const allCheckedHaveBarcode = checked.length > 0 && checked.filter(function () {
                        return $(this).data('has-barcode') == 1;
                    }).length === checked.length;

                    const allCheckedNotHaveBarcode = checked.length > 0 && checked.filter(function () {
                        return $(this).data('has-barcode') == 0;
                    }).length === checked.length;

                    // ⛔ Sembunyikan tombol jika semua data yang dicentang sudah punya barcode
                    if (allCheckedHaveBarcode) {
                        $('.btn-generated, .btn-scan').hide();
                    } else if (allCheckedNotHaveBarcode) {
                        $('.btn-generated, .btn-scan').show();
                        $('.btn-edit').prop('disabled', true);
                    }
                }
            });
        });
    }, delay);

    // Sembunyikan semua tombol di buttonConfig saat awal halaman dimuat
    buttonConfig.forEach(btn => {
        const el = $(btn.selector);
        if (el.length) {
            el.prop('disabled', true).hide();
        }
    });
}

function setEditButton({
    routeEditName
}) {
    // Tombol Edit: buka halaman edit dengan ID dari checkbox yang dicentang
    $(document).on('click', '.btn-edit', function () {
        const checked = $(`input[type="checkbox"]:not([id^="headerCheck"]):checked`);
        if (checked.length === 1) {
            const id = checked.val();
            const url = route(routeEditName, id);
            window.location.href = url;
        }
    });
}

$(function () {

    if ($("#purchase_request-table").length) {
        // Isi Table Data Produk
        initGridTable({
            tableId: "#purchase_request-table",
            gridData: Data.map(item => [
                item.checkbox,
                item.number,
                item.status,
                item.classification,
                item.pr_number,
                item.location,
                item.item_desc,
                item.uom,
                item.approved_date,
                item.unit_price,
                item.qty,
                item.amount,
                item.sla,
            ]),

            columns: [{
                    name: "#",
                    width: "60px",
                },
                {
                    name: "Status",
                    width: "130px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "Classification",
                    width: "200px"
                },
                {
                    name: "PR Number",
                    width: "180px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "Location",
                    width: "150px"
                },
                {
                    name: "Item Desc",
                    width: "200px"
                },
                {
                    name: "UOM",
                    width: "100px"
                },
                {
                    name: "Date",
                    width: "120px"
                },
                {
                    name: "Unit Price",
                    width: "200px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "Qty",
                    width: "90px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "Amount",
                    width: "200px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "SLA",
                    width: "100px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
            ],
            buttonConfig: [{
                    selector: ".btn-edit",
                    when: "one"
                },
                {
                    selector: ".btn-delete",
                    when: "any"
                },
            ]
        });

        setEditButton({
            routeEditName: "purchase-request.edit",
        });
    }
    if ($("#purchase_order-table").length) {
        // Isi Table Data Produk
        initGridTable({
            tableId: "#purchase_order-table",
            gridData: Data.map(item => [
                item.checkbox,
                item.number,
                item.pr_number,
                item.status,
                item.po_number,
                item.approved_date,
                item.supplier_name,
                item.qty,
                item.unit_price,
                item.amount,
                item.sla,
            ]),

            columns: [{
                    name: "#",
                    width: "60px"
                },
                {
                    name: "PR",
                    width: "80px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "Status",
                    width: "130px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                }, {
                    name: "PO Number",
                    width: "180px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "Date",
                    width: "120px"
                },
                {
                    name: "Supplier Name",
                    width: "200px"
                },
                {
                    name: "Qty",
                    width: "90px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "Unit Price",
                    width: "200px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "Amount",
                    width: "200px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
                {
                    name: "SLA",
                    width: "100px",
                    formatter: cell => h("div", {
                        innerHTML: cell
                    })
                },
            ],
            buttonConfig: [{
                    selector: ".btn-edit",
                    when: "one"
                },
                {
                    selector: ".btn-delete",
                    when: "any"
                },
            ]
        });

        setEditButton({
            routeEditName: "purchase-order.edit",
        });
    }
});
