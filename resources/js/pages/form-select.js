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
    new NiceSelect(document.getElementById("search-select"), {
        searchable: true
    });
});

document.addEventListener("DOMContentLoaded", function (e) {
    new NiceSelect(document.getElementById("status-select"), {
        searchable: true
    });
    new NiceSelect(document.getElementById("classification-select"), {
        searchable: true
    });
    new NiceSelect(document.getElementById("location-select"), {
        searchable: true
    });
});
