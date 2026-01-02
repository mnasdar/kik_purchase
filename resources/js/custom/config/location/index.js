/**
 * Modul Location - Main Entry Point
 * Mengintegrasikan semua modul CRUD unit kerja
 */

import $ from "jquery";
import { initLocationsTable, initRefreshButton } from "./location-read.js";
import { initCreateButton, initCreateSubmit, initModalClose, initFormSubmit } from "./location-create.js";
import { initEditButton, initUpdateSubmit } from "./location-update.js";
import { initDeleteButton, initBulkDeleteButton, initDeleteConfirm, initDeleteModalClose } from "./location-delete.js";

/**
 * Initialize all location modules
 */
$(document).ready(function () {
    // Read
    initLocationsTable();
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
