/**
 * Riwayat Pengajuan Invoice - Entry Point
 */
import $ from "jquery";
import { initHistoryTable, initHistoryRefresh, initBulkEdit } from "./history";

$(document).ready(function () {
    initHistoryTable();
    initHistoryRefresh();
    initBulkEdit();
});
