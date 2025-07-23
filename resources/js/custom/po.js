import $ from 'jquery';
import {
    Grid,
    h
} from 'gridjs';
import {
    route
} from 'ziggy-js';

// Variabel modal dan ID kontainer tabel
const $modal = $('#showprModal');
const tableId = "#show_pr-table";

// Tutup modal saat klik tombol dengan atribut [modal-close]
$('[modal-close]').on('click', function () {
    $(tableId).empty();
});

// Inisialisasi Grid.js
function initGridTable({
    gridData,
    columns,
    limit = 5
}) {
    const container = document.querySelector(tableId);
    if (!container) return;

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const newGridWrapper = document.createElement("div");
    newGridWrapper.style.overflowX = "auto"; // Tambah scroll horizontal
    container.appendChild(newGridWrapper);

    new Grid({
        columns,
        data: gridData,
        pagination: {
            limit
        },
        search: true,
        sort: true,
    }).render(newGridWrapper);
}

// Event klik tombol PR
$(document).on('click', '.btn-showpr', function () {
    const id = $(this).data('id');
    loadPRDetail(id);
    // Trigger tombol lain jika perlu
    $('.btn-show').trigger('click');
});

// Ambil dan render data PR
function loadPRDetail(purchaseOrderId) {
    $.ajax({
        url: route('purchase-order.show', purchaseOrderId),
        method: "GET",
        dataType: 'json',
        success: function (response) {
            const data = response;

            if (!data.length) {
                $(tableId).html('<p class="text-center py-4 text-gray-400">Data tidak ditemukan.</p>');
                return;
            }

            initGridTable({
                gridData: data.map(item => [
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
                ]
            });
        },
        error: function () {
            $(tableId).html('<p class="text-center text-red-500 py-4">Gagal memuat data.</p>');
        }
    });
}
