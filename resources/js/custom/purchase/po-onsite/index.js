/**
 * Modul PO Onsite - Entry Point
 * Mengelola tracking onsite dari items purchase order
 */
import $ from "jquery";
import { initOnsiteTable, initOnsiteRefresh, initOnsiteEdit, initDetailModal, initMultipleEdit, initFilterControls } from "./onsite-read";
import { initOnsiteDelete } from "./onsite-delete";

$(document).ready(function () {
    initOnsiteTable();
    initOnsiteRefresh();
    initOnsiteEdit();
    initDetailModal();
    initMultipleEdit();
    initFilterControls();
    initOnsiteDelete();
});
