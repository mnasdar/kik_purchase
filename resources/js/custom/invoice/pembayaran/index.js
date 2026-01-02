/**
 * Modul Pembayaran - Entry Point
 * Menggabungkan read, create, edit, refresh, delete, dan detail modal
 */
import $ from "jquery";
import { initPembayaranTable, initPembayaranRefresh, initPembayaranDelete, initDetailModal } from "./pembayaran-read";
import { initPembayaranCreate } from "./pembayaran-create";
import { initPembayaranEdit } from "./pembayaran-edit";

$(document).ready(function () {
    // Initialize based on current page
    const createForm = document.getElementById('form-create-pembayaran');
    const editForm = document.getElementById('pembayaranForm');
    
    if (createForm) {
        // Create page
        initPembayaranCreate();
    } else if (editForm) {
        // Edit page
        initPembayaranEdit();
    } else if (document.querySelector('[data-table-init]')) {
        // Index page
        initPembayaranTable();
        initPembayaranRefresh();
        initPembayaranDelete();
        initDetailModal();
    }
});
