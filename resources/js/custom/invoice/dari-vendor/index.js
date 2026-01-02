/**
 * Invoice Index - Entry Point
 */
import $ from "jquery";
import { initInvoiceTable, initInvoiceRefresh, initBulkEdit } from "./dari-vendor-read";
import { initInvoiceDelete } from "./dari-vendor-delete";

$(document).ready(function () {
    initInvoiceTable();
    initInvoiceRefresh();
    initBulkEdit();
    initInvoiceDelete();
});
