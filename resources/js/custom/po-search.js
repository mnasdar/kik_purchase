import $ from "jquery";
import Swal from "sweetalert2";
import { Grid, h } from "gridjs";
import { route } from "ziggy-js";

const $modal = $("#hasilCariModal");
const form = $("#formCariPo");
const tableId = "#hasilCari-table";
// Ambil prefix Halaman
const path = window.location.pathname; // Ambil path dari URL
const segments = path.split("/"); // Pecah berdasarkan slash
const prefix = segments[1]; // Cari nilai "prefix" dari segment ke-1 (setelah domain)

function openModal() {
    $modal.removeClass("hidden").addClass("flex");
}

function closeModal() {
    $modal.addClass("hidden").removeClass("flex");
    $(tableId).empty();
    $("#inputCari").focus();
}

$("[data-fc-dismiss]").on("click", function () {
    closeModal();
});

function initGridTable({ gridData, columns, limit = 5 }) {
    const container = document.querySelector(tableId);
    if (!container) return;

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const newGridWrapper = document.createElement("div");
    container.appendChild(newGridWrapper);

    new Grid({
        columns,
        data: gridData,
        pagination: { limit },
        search: true,
        sort: true,
    }).render(newGridWrapper);
}

form.on("submit", function (e) {
    e.preventDefault();

    const keywords = $("#inputCari").val();
    const url = route("po-onsite.search", [prefix, keywords]);

    const formData = {};
    form.find("[name]").each(function () {
        const name = $(this).attr("name");
        formData[name] = $(this).val();
    });

    if (!formData["search"] || formData["search"].trim() === "") {
        Swal.fire({
            icon: "warning",
            title: "Input kosong",
            text: "Silakan isi keyword pencarian terlebih dahulu.",
        });
        return;
    }

    $.ajax({
        url,
        method: "GET",
        data: formData,
        beforeSend: function () {
            $(tableId).empty();
            $(tableId).append(
                '<p class="text-center py-4 text-gray-500">Memuat data...</p>'
            );
        },
        success: function (data) {
            if (!data.length) {
                $(tableId).html(
                    '<p class="text-center py-4 text-gray-400">Data tidak ditemukan.</p>'
                );
                openModal();
                return;
            }

            const gridData = data.map((item) => [
                item.number,
                `<button class="btn-pilih bg-blue-500 text-white py-1 px-3 rounded text-sm" data-po='${JSON.stringify(
                    item
                )}'>Pilih</button>`,
                item.status,
                item.po_number,
                item.approved_date,
                item.supplier_name,
                item.qty,
                item.unit_price,
                item.amount,
                item.sla,
            ]);

            initGridTable({
                gridData,
                columns: [
                    { name: "#", width: "60px" },
                    {
                        name: "Aksi",
                        width: "100px",
                        formatter: (cell) => h("div", { innerHTML: cell }),
                    },
                    {
                        name: "Status",
                        width: "130px",
                        formatter: (cell) => h("div", { innerHTML: cell }),
                    },
                    {
                        name: "PO Number",
                        width: "200px",
                        formatter: (cell) => h("div", { innerHTML: cell }),
                    },
                    { name: "Date", width: "120px" },
                    { name: "Supplier Name", width: "200px" },
                    {
                        name: "Qty",
                        width: "90px",
                        formatter: (cell) => h("div", { innerHTML: cell }),
                    },
                    {
                        name: "Unit Price",
                        width: "200px",
                        formatter: (cell) => h("div", { innerHTML: cell }),
                    },
                    {
                        name: "Amount",
                        width: "200px",
                        formatter: (cell) => h("div", { innerHTML: cell }),
                    },
                    {
                        name: "SLA",
                        width: "100px",
                        formatter: (cell) => h("div", { innerHTML: cell }),
                    },
                ],
            });
            openModal();
            $("#inputCari").val("");
        },
        error: function () {
            $(tableId).html(
                '<p class="text-center text-red-500">Gagal memuat data.</p>'
            );
        },
    });
});

export { prefix ,closeModal };
