import { h } from "gridjs";
import initGridModalSearch from "../modules/gridModalSearch";
import initTableResult from "../modules/tableResult";
import initSaveModule from "../modules/btnsave";

// 🔹 Format angka ke Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat("id-ID").format(angka);
}

// 🔹 Inisialisasi Search
const { closeModal } = initGridModalSearch({
    modalId: "#hasilCariModal",
    formId: "#formCari",
    tableId: "#hasilCari-table",
    routeName: "dari-vendor.search",
    pageLimit: 5,
    mapGridData: (item) => [
        item.number,
        `<button class="btn-pilih bg-blue-500 text-white py-1 px-3 rounded text-sm" data-search='${JSON.stringify(
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
    ],
    gridColumns: [
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

// 🔹 Inisialisasi Result
initTableResult({
    tableBodySelector: "#poTableBody",
    closeModal,
    rowTemplate: (data, counter) => {
        const total = formatRupiah(data.total);
        const harga = formatRupiah(data.harga);
        const jumlah = formatRupiah(data.jumlah);

        return `
            <tr data-po_number="${data.nomor_po}">
            <td class="whitespace-nowrap py-4 ps-4 pe-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                <b>${counter}.</b>
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${data.status}
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${data.po_number}
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${data.approved_date}
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${data.supplier_name}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 harga-produk">
                <div class="items-center py-1 px-3 rounded text-sm font-medium bg-blue-100 text-blue-800">
                    <div class="flex justify-between items-center">
                        <span>Rp. </span><span>${harga}</span>
                    </div>
                </div>
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${jumlah}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 harga-produk">
                <div class="items-center py-1 px-3 rounded text-sm font-medium bg-blue-100 text-blue-800">
                    <div class="flex justify-between items-center">
                        <span>Rp. </span><span>${total}</span>
                    </div>
                </div>
            </td>
            <td class="whitespace-nowrap py-4 px-3 text-center text-sm font-medium">
                <a href="javascript:void(0);" class="btn-hapus ms-0.5">
                    <i class="mgc_delete_line text-xl"></i>
                </a>
            </td>
        </tr>
        `;
    },
});

initSaveModule({
    formId: "#form-proses",
    data_id:"po_number",
});
