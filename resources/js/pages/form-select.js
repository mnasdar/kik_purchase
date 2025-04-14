import NiceSelect from "nice-select2/src/js/nice-select2.js";

//===============================
document.addEventListener("DOMContentLoaded", function (e) {
    // default
    var els = document.querySelectorAll(".selectize");
    els.forEach(function (select) {
        new NiceSelect(select);
    });
});


document.addEventListener("DOMContentLoaded", function (e) {
    // serachable
    document.querySelectorAll('.search-select').forEach(function (el) {
        new NiceSelect(el, {
            searchable: true
        });
    });
});
