/**
 * Modul Supplier - Main Entry Point
 * Mengintegrasikan semua modul CRUD supplier
 */

import $ from "jquery";
import { initSuppliersTable, initRefreshButton } from "./supplier-read.js";
import { initCreateButton, initCreateSubmit, initModalClose, initFormSubmit } from "./supplier-create.js";
import { initEditButton, initUpdateSubmit } from "./supplier-update.js";
import { initDeleteButton, initBulkDeleteButton, initDeleteConfirm, initDeleteModalClose } from "./supplier-delete.js";

/**
 * Initialize all supplier modules
 */
$(document).ready(function () {
    // Read
    initSuppliersTable();
    initRefreshButton();
    
    // Create
    initCreateButton();
    initCreateSubmit();
    initFormSubmit();
    initModalClose();
    
    // Update
    initEditButton();
    initUpdateSubmit();
    
    // Delete
    initDeleteButton();
    initBulkDeleteButton();
    initDeleteConfirm();
    initDeleteModalClose();
});
