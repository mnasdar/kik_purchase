/**
 * Pengajuan Invoice - Entry Point
 */
import $ from "jquery";
import { initPengajuanTable, initPengajuanRefresh, initBulkSubmit } from "./pengajuan-read";

$(document).ready(function () {
    initPengajuanTable();
    initPengajuanRefresh();
    initBulkSubmit();
});
