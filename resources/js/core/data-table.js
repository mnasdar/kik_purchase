import { Grid, h, html } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import GLightbox from "glightbox";

/**
 * Helper: Extract plain text from HTML string
 */
export function extractText(value) {
    if (value === null || value === undefined) return "";
    let s = String(value);

    if (/<[a-z][\s\S]*>/i.test(s)) {
        const tmp = document.createElement("div");
        tmp.innerHTML = s;
        s = tmp.textContent || tmp.innerText || "";
    }

    s = s
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return s;
}

/**
 * Helper: Capitalize each word for option labels
 */
export function capitalizeWords(str) {
    return String(str)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Convert object-based gridData to array rows according to columns order (for Grid.js)
 */
export function buildRenderData(
    gridDataObjects = [],
    columns = [],
    enableCheckbox = true
) {
    return gridDataObjects.map((obj) => {
        const row = [];
        // First checkbox (obj.checkbox) only if enabled
        if (enableCheckbox) {
            row.push(obj.checkbox ?? "");
        }
        // Then according to columns param order (request id)
        columns.forEach((col) => {
            const key = col.id ?? null;
            row.push(key ? obj[key] ?? "" : "");
        });
        return row;
    });
}

/**
 * Initialize Grid Table
 * @param {Object} config - Configuration object
 * @param {string} config.tableId - Table selector ID
 * @param {Array} config.gridData - Array of data objects
 * @param {string} config.dataUrl - URL to fetch data (alternative to gridData)
 * @param {Array} config.columns - Column definitions
 * @param {number} config.limit - Pagination limit
 * @param {number} config.delay - Delay before rendering
 * @param {Array} config.buttonConfig - Button configuration
 * @param {boolean} config.enableFilter - Enable dynamic filtering
 * @param {Array} config.excludeFilterKeys - Keys to exclude from filter
 * @param {Function} config.extraHandler - Extra handler function
 * @param {Array} config.originalGridData - Original data for filtering
 * @param {boolean} config.enableCheckbox - Enable checkbox column
 */
export function initGridTable({
    tableId,
    gridData = [],
    dataUrl = null,
    columns = [],
    limit = 10,
    delay = 200,
    buttonConfig = [],
    enableFilter = false,
    excludeFilterKeys = ["checkbox", "number"],
    extraHandler = null,
    originalGridData = null,
    enableCheckbox = true, // Parameter baru: default false untuk menyembunyikan checkbox
    onDataLoaded = null,
}) {
    if (!$(tableId).length) return;

    // If originalGridData not sent, save copy from current gridData
    if (!originalGridData)
        originalGridData = Array.isArray(gridData) ? gridData.slice() : [];

    const headerCheckId = `headerCheck-${tableId.replace("#", "")}`;
    const container = document.querySelector(tableId);

    // Store original data in element container for handler access
    $(container).data("originalGridData", originalGridData);

    // Configure data source
    let dataConfig;
    if (dataUrl) {
        dataConfig = () =>
            fetch(dataUrl)
                .then((res) => res.json())
                .then((data) => {
                    if (typeof onDataLoaded === "function") {
                        try { onDataLoaded(data); } catch (e) { console.error(e); }
                    }
                    return buildRenderData(data, columns, enableCheckbox);
                });
    } else {
        if (typeof onDataLoaded === "function") {
            try { onDataLoaded(gridData); } catch (e) { console.error(e); }
        }
        dataConfig = buildRenderData(gridData, columns, enableCheckbox);
    }

    // Build column defs for Grid.js
    const gridColumns = [];

    // Tambahkan kolom checkbox hanya jika enableCheckbox = true
    if (enableCheckbox) {
        gridColumns.push({
            id: "checkbox",
            name: html(
                `<div class="form-check"><input type="checkbox" class="form-checkbox rounded text-primary" id="${headerCheckId}"></div>`
            ),
            width: "50px",
            sort: false,
            formatter: (cell) => h("div", { innerHTML: cell }),
        });
    }

    // Map user columns
    gridColumns.push(
        ...columns.map((c) => {
            const col = { 
                id: c.id,  // Pastikan id selalu ada
                name: c.name 
            };
            if (c.width) col.width = c.width;
            if (c.sort === false) col.sort = false;
            if (typeof c.formatter === "function") {
                col.formatter = (cell) => c.formatter(cell);
            }
            return col;
        })
    );

    // Render Grid.js
    const grid = new Grid({
        columns: gridColumns,
        pagination: { limit },
        search: true,
        sort: true,
        data: dataConfig,
    });

    // Store grid instance on container
    $(container).data('grid', grid);

    grid.render(container)
        .on("ready", () => {
            GLightbox({ selector: ".image-popup", title: false });
        });

    // Checkbox & button logic (hanya jalankan jika enableCheckbox = true)
    if (enableCheckbox) {
        setTimeout(() => {
            const selector = `${tableId} input[type="checkbox"]`;

            // Header checkbox
            $(document).on("change", `#${headerCheckId}`, function () {
                const isChecked = $(this).is(":checked");
                $(`${selector}`)
                    .not(this)
                    .prop("checked", isChecked)
                    .trigger("change");
            });

            // Row checkbox
            $(document).on(
                "change",
                `${selector}:not(#${headerCheckId})`,
                function () {
                    const checkboxes = $(`${selector}:not(#${headerCheckId})`);
                    const checked = checkboxes.filter(":checked");

                    $(`#${headerCheckId}`).prop(
                        "checked",
                        checkboxes.length === checked.length
                    );

                    // Process button configuration
                    buttonConfig.forEach((btn) => {
                        const el = $(btn.selector);
                        if (!el.length) return;
                        let enable = false;
                        switch (btn.when) {
                            case "one":
                                enable = checked.length === 1;
                                break;
                            case "multiple":
                                enable = checked.length > 1;
                                break;
                            case "any":
                                enable = checked.length > 0;
                                break;
                        }
                        el.prop("disabled", !enable);
                        if (checked.length === 0) el.hide();
                        else el.show();
                    });

                    // Special logic for barcode (if has-barcode data attribute exists)
                    if (checked.length > 0) {
                        const allCheckedHaveBarcode =
                            checked.filter(function () {
                                return $(this).data("has-barcode") == 1;
                            }).length === checked.length;

                        const allCheckedNotHaveBarcode =
                            checked.filter(function () {
                                return $(this).data("has-barcode") == 0;
                            }).length === checked.length;

                        if (allCheckedHaveBarcode) {
                            $(".btn-generated, .btn-scan").hide();
                        } else if (allCheckedNotHaveBarcode) {
                            $(".btn-generated, .btn-scan").show();
                            $(".btn-edit, .btn-delete").prop("disabled", true);
                        }
                    }

                    if (typeof extraHandler === "function")
                        extraHandler(checked);
                }
            );
        }, delay + 50);

        // Hide buttons at start
        buttonConfig.forEach((btn) => {
            const el = $(btn.selector);
            if (el.length) el.prop("disabled", true).hide();
        });
    }

    // Optional dynamic filter
    if (
        enableFilter &&
        (originalGridData.length > 0 || (gridData && gridData.length > 0))
    ) {
        const sourceForKeys = originalGridData.length
            ? originalGridData
            : gridData;
        const keys = Object.keys(sourceForKeys[0] || {});
        const $filterColumn = $("#filter-column");
        $filterColumn.empty();

        keys.forEach((key) => {
            if (!excludeFilterKeys.includes(key)) {
                $filterColumn.append(
                    $("<option>", { value: key, text: capitalizeWords(key) })
                );
            }
        });
    }
    return grid;
}

/**
 * Reload Table
 */
export function reloadTable(config) {
    $(config.tableId).empty();
    initGridTable(config);
}

/**
 * Set Edit Button Handler
 */
export function setEditButton({ routeEditName, routeParams = {} }) {
    $(document).on("click", ".btn-edit", function () {
        const checked = $(
            `input[type="checkbox"]:not([id^="headerCheck"]):checked`
        );
        if (checked.length === 1) {
            const id = checked.val();
            // Build params with purchase_request ID
            const params = { ...routeParams, purchase_request: id };
            const url = route(routeEditName, params);
            window.location.href = url;
        }
    });
}
