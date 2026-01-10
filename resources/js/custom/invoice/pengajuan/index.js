/**
 * Pengajuan Invoice - Entry Point
 */
import $ from "jquery";
import { initPengajuanTable, initPengajuanRefresh, initBulkEdit, initBulkDelete } from "./pengajuan-read";

$(document).ready(function () {
    initPengajuanTable();
    initPengajuanRefresh();
    initBulkEdit();
    initBulkDelete();
});
