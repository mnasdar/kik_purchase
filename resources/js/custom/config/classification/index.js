/**
 * Modul Classification - Main Entry Point
 * Mengintegrasikan semua modul CRUD klasifikasi
 */

import $ from "jquery";
import { initClassificationsTable, initRefreshButton } from "./classification-read.js";
import { initCreateButton, initCreateSubmit, initModalClose, initFormSubmit } from "./classification-create.js";
import { initEditButton, initUpdateSubmit } from "./classification-update.js";
import { initDeleteButton, initBulkDeleteButton, initDeleteConfirm, initDeleteModalClose } from "./classification-delete.js";

/**
 * Initialize all classification modules
 */
$(document).ready(function () {
    // Read
    initClassificationsTable();
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
