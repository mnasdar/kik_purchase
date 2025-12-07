/**
 * Modul Purchase Request - Delete
 * Mengelola bulk delete purchase request
 *
 * @module modules/purchase-request/purchase-request-delete
 */

import { initDeleteForm } from "../../core/form-handler.js";
import { route } from "ziggy-js";
import $ from "jquery";

/**
 * Inisialisasi form delete purchase request
 */
function initPRDelete() {
    // Get prefix from data attribute
    const prefix = $('[data-prefix]').data('prefix') || document.body.dataset.prefix;
    
    initDeleteForm({
        tableSelector: "#table-pr",
        buttonSelector: "#btn-delete-pr",
        deleteUrl: route('purchase-request.bulkDestroy', { prefix }),
        itemName: "purchase request",
        onSuccess: () => {
            location.reload();
        },
    });
}

// Inisialisasi
initPRDelete();

export { initPRDelete };
