/**
 * Modul Purchase Request - Update
 * Mengelola form update purchase request
 *
 * @module modules/purchase-request/purchase-request-update
 */

import { initUpdateForm, setupNumberInput } from "../../core/form-handler.js";
import { route } from "ziggy-js";
import $ from "jquery";
import AutoNumeric from "autonumeric";
import flatpickr from "flatpickr";

// Get prefix from URL or data attribute
const prefix = $('[data-prefix]').data('prefix') || document.body.dataset.prefix;

/**
 * Inisialisasi form update purchase request
 */
function initPRUpdate() {
    if (!$("#form-edit-pr").length) return;

    initUpdateForm({
        formSelector: "#form-edit-pr",
        confirmMessage: "Data purchase request akan diperbarui.",
        successMessage: "Purchase request berhasil diperbarui.",
        onSuccess: (response) => {
            window.location.href = response.redirect || route("purchase-request.index", { prefix });
        },
        onError: (xhr) => {
            console.error("Error updating PR:", xhr);
        },
        beforeSubmit: () => {
            $("#form-edit-pr p[id^='error-']").text("");

            const formData = new FormData(document.getElementById("form-edit-pr"));
            const validation = validatePRForm(formData);

            if (!validation.isValid) {
                Object.entries(validation.errors).forEach(([field, message]) => {
                    $(`#error-${field}`).text(message);
                });
                return false;
            }
            return true;
        },
    });

    setupPRInputs();
}

/**
 * Validasi form purchase request
 */
function validatePRForm(formData) {
    const errors = {};

    // PR Number tidak perlu validasi (auto-generated & readonly)

    const status = formData.get("status");
    if (!status) {
        errors["status"] = "Status harus dipilih.";
    }

    const classification = formData.get("classification");
    if (!classification) {
        errors["classification"] = "Classification harus dipilih.";
    }

    const location = formData.get("location");
    if (!location) {
        errors["location"] = "Location harus dipilih.";
    }

    const itemDescription = formData.get("item_description");
    if (!itemDescription || itemDescription.trim() === "") {
        errors["item_description"] = "Item description harus diisi.";
    }

    const uom = formData.get("uom");
    if (!uom || uom.trim() === "") {
        errors["uom"] = "UOM harus diisi.";
    }

    const quantity = parseFloat(formData.get("quantity")) || 0;
    if (quantity <= 0) {
        errors["quantity"] = "Quantity harus lebih dari 0.";
    }

    const unitPrice = parseFloat(formData.get("unit_price")) || 0;
    if (unitPrice <= 0) {
        errors["unit_price"] = "Unit price harus lebih dari 0.";
    }

    const approvedDate = formData.get("approved_date");
    if (!approvedDate) {
        errors["approved_date"] = "Approved date harus diisi.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors,
    };
}

/**
 * Setup input untuk form purchase request
 */
function setupPRInputs() {
    setupNumberInput('input[type="number"]');

    // Initialize AutoNumeric for currency fields FIRST
    const currencyOptions = {
        currencySymbol: '',
        currencySymbolPlacement: 's',
        decimalCharacter: ',',
        digitGroupSeparator: '.',
        decimalPlaces: 0,
        unformatOnSubmit: true,
    };

    // Apply AutoNumeric to currency inputs
    const autoNumericInstances = {};
    document.querySelectorAll('.autonumeric-currency').forEach((el) => {
        autoNumericInstances[el.id] = new AutoNumeric(el, currencyOptions);
    });

    // Initialize Flatpickr for approved_date AFTER AutoNumeric
    const approvedDateEl = document.getElementById('approved_date');
    const dateValue = approvedDateEl.getAttribute('data-date');
    
    flatpickr("#approved_date", {
        altInput: true,
        altFormat: "d-m-Y",
        dateFormat: "Y-m-d",
        defaultDate: dateValue || new Date(),
        locale: {
            firstDayOfWeek: 1
        }
    });

    // Handle cancel button
    $("#btn-cancel").on("click", function () {
        const url = $(this).data("url") || route("purchase-request.index", { prefix });
        window.location.href = url;
    });

    // Calculate amount when quantity or unit_price changes
    $("#quantity, #unit_price").on("change", function () {
        calculateAmount(autoNumericInstances);
    });

    // Also trigger on input for real-time calculation
    $("#quantity, #unit_price").on("input", function () {
        calculateAmount(autoNumericInstances);
    });
}

/**
 * Calculate amount from quantity and unit price
 */
function calculateAmount(instances) {
    try {
        const quantityEl = document.getElementById("quantity");
        const unitPriceEl = document.getElementById("unit_price");
        const amountEl = document.getElementById("amount");

        if (!quantityEl || !unitPriceEl || !amountEl) return;

        let quantity = parseFloat(quantityEl.value) || 0;
        let unitPrice = 0;

        // Get unformatted value from AutoNumeric if available
        if (instances['unit_price'] && typeof instances['unit_price'].getNumericValue === 'function') {
            unitPrice = instances['unit_price'].getNumericValue() || 0;
        } else {
            // Fallback: parse the visible value
            const rawValue = unitPriceEl.value || '0';
            unitPrice = parseFloat(rawValue.replace(/\./g, '').replace(/,/g, '.')) || 0;
        }

        const amount = quantity * unitPrice;

        // Set amount using AutoNumeric if available
        if (instances['amount'] && typeof instances['amount'].set === 'function') {
            instances['amount'].set(amount);
        } else {
            amountEl.value = amount;
        }
    } catch (error) {
        console.error('Error calculating amount:', error);
    }
}
// Inisialisasi
initPRUpdate();

export { initPRUpdate, validatePRForm, setupPRInputs };
