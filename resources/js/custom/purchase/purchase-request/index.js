/**
 * Modul Purchase Request - Main Entry Point
 * Mengintegrasikan semua modul CRUD purchase request
 */

import $ from "jquery";
import { initPRTable, initRefreshButton, initEditButton, initDetailModal, initFilterControls } from "./pr-read.js";
import { initPRDelete } from "./pr-delete.js";

/**
 * Initialize all PR modules
 */
$(document).ready(function () {
    // Read
    initPRTable();
    initRefreshButton();
    initEditButton();
    initDetailModal();
    initFilterControls();
    
    // Delete
    initPRDelete();
});
