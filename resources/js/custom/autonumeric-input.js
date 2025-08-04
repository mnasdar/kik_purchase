import $ from "jquery";
import AutoNumeric from "autonumeric";

// Map penyimpanan instance AutoNumeric agar bisa diakses ulang
const autoNumericInstances = new Map();

/**
 * Inisialisasi AutoNumeric untuk input tertentu
 * @param {string} selector - ID atau class input (misal: #inputUnitPrice)
 * @param {object} options - Opsi tambahan jika ingin override
 */
export function initCurrencyInput(selector, options = {}) {
    const $el = $(selector);
    if (!$el.length) return;

    const defaultOptions = {
        digitGroupSeparator: ".",
        decimalCharacter: ",",
        decimalPlaces: 0,
        currencySymbol: "Rp. ",
        currencySymbolPlacement: "p", // prefix
        unformatOnSubmit: true,
        modifyValueOnWheel: false,
        negativeSignAllowed: false, // ⛔ Tidak izinkan tanda minus
        minimumValue: "0", // ✅ Angka minimal 0 (tanpa minus)
    };

    const finalOptions = { ...defaultOptions, ...options };

    const instance = new AutoNumeric($el[0], finalOptions);
    autoNumericInstances.set(selector, instance);
}

/**
 * Hitung amount dari dua input (harga × jumlah), dan tampilkan di input target
 * Semua input harus sudah didaftarkan dengan initCurrencyInput()
 *
 * @param {string} unitSelector - ID input unit price (misal: #inputUnitPrice)
 * @param {string} qtySelector - ID input quantity (misal: #inputQty)
 * @param {string} amountSelector - ID input amount hasil kalkulasi
 */
export function initAmountAutoCalc(unitSelector, qtySelector, amountSelector) {
    const $unit = $(unitSelector);
    const $qty = $(qtySelector);
    const $amount = $(amountSelector);

    if (!$unit.length || !$qty.length || !$amount.length) return;

    const unitInstance = autoNumericInstances.get(unitSelector);
    const qtyInstance = autoNumericInstances.get(qtySelector);
    const amountInstance = autoNumericInstances.get(amountSelector);

    if (!unitInstance || !qtyInstance || !amountInstance) return;

    function hitungAmount() {
        const unitVal = unitInstance.getNumber();
        const qtyVal = qtyInstance.getNumber();
        const total = unitVal * qtyVal;

        amountInstance.set(total);
    }

    $unit.on("input", hitungAmount);
    $qty.on("input", hitungAmount);

    // Hitung sekali saat pertama load
    hitungAmount();
}
