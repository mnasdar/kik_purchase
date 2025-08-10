import { h } from "gridjs";
import initGridModalSearch from "../modules/gridModalSearch";

const { closeModal } = initGridModalSearch({
    modalId: "#hasilCariModal",
    formId: "#formCari",
    tableId: "#hasilCari-table",
    routeName: "terima-dari-vendor.search",
    pageLimit: 5,
    mapGridData: (item) => [
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
