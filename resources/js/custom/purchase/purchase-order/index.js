/**
 * Modul Purchase Order - Entry Point
 * Menyatukan read, refresh, edit nav, dan delete (mirip PR)
 */
import $ from "jquery";
import { initPOTable, initPORefresh, initPOEdit, initDetailModal, initFilterControls } from "./po-read";
import { initPODelete } from "./po-delete";

$(document).ready(function () {
    initPOTable();
    initPORefresh();
    initPOEdit();
    initDetailModal();
    initFilterControls();
    initPODelete();
});
