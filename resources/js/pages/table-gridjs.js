/*
Template Name: Konrix - Responsive 5 Admin Dashboard
Author: CoderThemes
Website: https://coderthemes.com/
Contact: support@coderthemes.com
File: datatable js
*/

import {
    Grid,
    h,
    html
} from "gridjs";
window.gridjs = Grid;

class GridDatatable {

    init() {
        this.basicTableInit();
    }

    basicTableInit() {

        // Purchase Request Table
        if (document.getElementById("table-purchase-request"))
            new Grid({
                columns: [{
                        name: 'ID',
                        width: '75px',
                        formatter: (function (cell) {
                            return html('<span class="fw-semibold">' + cell + '</span>');
                        })
                    },
                    "PR Number", "Location", "Item Desc", "Approved Date", "Quantity", "PR Amount",
                    {
                        name: 'SLA',
                        width: '75px',
                        formatter: (function (cell) {
                            // Jika SLA lebih dari 7, beri warna merah (danger), jika tidak, beri warna hijau (success)
                            const colorClass = cell > 7 ? 'bg-red-500' : 'bg-green-500';
                            return html(`<span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${colorClass} text-white">${cell}</span>`);
                        })
                    },
                    {
                        name: 'Actions',
                        width: '120px',
                        formatter: (function (cell) {
                            return html("<a href='#' class='text-reset text-decoration-underline'>" +
                                "<span class='inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium btn border-warning text-warning hover:bg-warning hover:text-white' data-fc-type='tooltip' data-fc-placement='top'>" +
                                "<i class='mgc_pencil_fill text-base'></i> " +
                                "</span>" +
                                "<div class='bg-slate-700 hidden px-2 py-1 rounded transition-all text-white opacity-0 z-50' role='tooltip'>" +
                                " Edit " +
                                "<div data-fc-arrow class='bg-slate-700 w-2.5 h-2.5 rotate-45 -z-10 rounded-[1px]'></div></div>" +
                                "</a>");
                        })
                    },
                ],
                pagination: {
                    limit: 10
                },
                sort: true,
                search: true,
                data: [
                    ["01", "KIK0000007320", "HEAD OFFICE KIK.", "MAP FILE (SPRING FILE WARNA BIRU 1, HITAM 1, KUNING 1)", "16-Jan-2024", "3", 240000, 4],
                    ["02", "KIK0000007320", "HEAD OFFICE KIK.", "TINTA PRINTER EPSON 664 (BLACK, CYAN, MAGENTA)", "16-Jan-2024", "1", 300000, 7],
                    ["03", "KIK0000007320", "HEAD OFFICE KIK.", "KERTAS HVS A4 75 GRAM MULTIFUNGSI (SiDU)", "16-Jan-2024", "5", 210000, 11],
                    ["04", "KIK0000007320", "HEAD OFFICE KIK.", "MAP PLASTIK BUSINESS FILE ", "16-Jan-2024", "5", 120000, 8],
                    ["05", "KIK0000007320", "HEAD OFFICE KIK.", "MOUSE WIRELESS (LOGITECH M170 BLACK) (BPK. YOGA & IBU RIFKHA)", "16-Jan-2024", "2", 340000, 5],
                    ["06", "KIK0000007320", "HEAD OFFICE KIK.", "ISOLASI BENING 2 INCH DAIMARU", "16-Jan-2024", "2", 20000, 10],
                    ["07", "KIK0000007320", "HEAD OFFICE KIK.", "GUNTING (JOYKO)", "16-Jan-2024", "2", 30000, 9],
                    ["08", "KIK0000007320", "HEAD OFFICE KIK.", "BUKU NOTED (CATATAN) KECIL", "16-Jan-2024", "1", 10000, 2],
                    ["09", "KIK0000007320", "HEAD OFFICE KIK.", "MAP FILE (SPRING FILE) (HITAM 1 DAN KUNING 1)", "16-Jan-2024", "2", 160000, 1],
                    ["10", "KIK0000007343", "HEAD OFFICE KIK.", "SSD Sandisk External Portable 1TB V2-E61", "24-Jan-2024", "3", 5370000, 11],

                ]
            }).render(document.getElementById("table-purchase-request"));

        // Basic Table
        if (document.getElementById("table-gridjs"))
            new Grid({
                columns: [{
                        name: 'ID',
                        formatter: (function (cell) {
                            return html('<span class="fw-semibold">' + cell + '</span>');
                        })
                    },
                    "Name",
                    {
                        name: 'Email',
                        formatter: (function (cell) {
                            return html('<a href="">' + cell + '</a>');
                        })
                    },
                    "Position", "Company", "Country",
                    {
                        name: 'Actions',
                        width: '120px',
                        formatter: (function (cell) {
                            return html("<a href='#' class='text-reset text-decoration-underline'>" + "Details" + "</a>");
                        })
                    },
                ],
                pagination: {
                    limit: 5
                },
                sort: true,
                search: true,
                data: [
                    ["01", "Jonathan", "jonathan@example.com", "Senior Implementation Architect", "Hauck Inc", "Holy See"],
                    ["02", "Harold", "harold@example.com", "Forward Creative Coordinator", "Metz Inc", "Iran"],
                    ["03", "Shannon", "shannon@example.com", "Legacy Functionality Associate", "Zemlak Group", "South Georgia"],
                    ["04", "Robert", "robert@example.com", "Product Accounts Technician", "Hoeger", "San Marino"],
                    ["05", "Noel", "noel@example.com", "Customer Data Director", "Howell - Rippin", "Germany"],
                    ["06", "Traci", "traci@example.com", "Corporate Identity Director", "Koelpin - Goldner", "Vanuatu"],
                    ["07", "Kerry", "kerry@example.com", "Lead Applications Associate", "Feeney, Langworth and Tremblay", "Niger"],
                    ["08", "Patsy", "patsy@example.com", "Dynamic Assurance Director", "Streich Group", "Niue"],
                    ["09", "Cathy", "cathy@example.com", "Customer Data Director", "Ebert, Schamberger and Johnston", "Mexico"],
                    ["10", "Tyrone", "tyrone@example.com", "Senior Response Liaison", "Raynor, Rolfson and Daugherty", "Qatar"],
                ]
            }).render(document.getElementById("table-gridjs"));

        // card Table
        if (document.getElementById("table-card"))
            new Grid({
                columns: ["Name", "Email", "Position", "Company", "Country"],
                sort: true,
                pagination: {
                    limit: 5
                },
                data: [
                    ["Jonathan", "jonathan@example.com", "Senior Implementation Architect", "Hauck Inc", "Holy See"],
                    ["Harold", "harold@example.com", "Forward Creative Coordinator", "Metz Inc", "Iran"],
                    ["Shannon", "shannon@example.com", "Legacy Functionality Associate", "Zemlak Group", "South Georgia"],
                    ["Robert", "robert@example.com", "Product Accounts Technician", "Hoeger", "San Marino"],
                    ["Noel", "noel@example.com", "Customer Data Director", "Howell - Rippin", "Germany"],
                    ["Traci", "traci@example.com", "Corporate Identity Director", "Koelpin - Goldner", "Vanuatu"],
                    ["Kerry", "kerry@example.com", "Lead Applications Associate", "Feeney, Langworth and Tremblay", "Niger"],
                    ["Patsy", "patsy@example.com", "Dynamic Assurance Director", "Streich Group", "Niue"],
                    ["Cathy", "cathy@example.com", "Customer Data Director", "Ebert, Schamberger and Johnston", "Mexico"],
                    ["Tyrone", "tyrone@example.com", "Senior Response Liaison", "Raynor, Rolfson and Daugherty", "Qatar"],
                ]
            }).render(document.getElementById("table-card"));


        // pagination Table
        if (document.getElementById("table-pagination"))
            new Grid({
                columns: [{
                        name: 'ID',
                        width: '120px',
                        formatter: (function (cell) {
                            return html('<a href="" class="fw-medium">' + cell + '</a>');
                        })
                    }, "Name", "Date", "Total", "Status",
                    {
                        name: 'Actions',
                        width: '100px',
                        formatter: (function (cell) {
                            return html("<button type='button' class='btn btn-sm btn-light'>" +
                                "Details" +
                                "</button>");
                        })
                    },
                ],
                pagination: {
                    limit: 5
                },

                data: [
                    ["#VL2111", "Jonathan", "07 Oct, 2021", "$24.05", "Paid", ],
                    ["#VL2110", "Harold", "07 Oct, 2021", "$26.15", "Paid"],
                    ["#VL2109", "Shannon", "06 Oct, 2021", "$21.25", "Refund"],
                    ["#VL2108", "Robert", "05 Oct, 2021", "$25.03", "Paid"],
                    ["#VL2107", "Noel", "05 Oct, 2021", "$22.61", "Paid"],
                    ["#VL2106", "Traci", "04 Oct, 2021", "$24.05", "Paid"],
                    ["#VL2105", "Kerry", "04 Oct, 2021", "$26.15", "Paid"],
                    ["#VL2104", "Patsy", "04 Oct, 2021", "$21.25", "Refund"],
                    ["#VL2103", "Cathy", "03 Oct, 2021", "$22.61", "Paid"],
                    ["#VL2102", "Tyrone", "03 Oct, 2021", "$25.03", "Paid"],
                ]
            }).render(document.getElementById("table-pagination"));

        // search Table
        if (document.getElementById("table-search"))
            new Grid({
                columns: ["Name", "Email", "Position", "Company", "Country"],
                pagination: {
                    limit: 5
                },
                search: true,
                data: [
                    ["Jonathan", "jonathan@example.com", "Senior Implementation Architect", "Hauck Inc", "Holy See"],
                    ["Harold", "harold@example.com", "Forward Creative Coordinator", "Metz Inc", "Iran"],
                    ["Shannon", "shannon@example.com", "Legacy Functionality Associate", "Zemlak Group", "South Georgia"],
                    ["Robert", "robert@example.com", "Product Accounts Technician", "Hoeger", "San Marino"],
                    ["Noel", "noel@example.com", "Customer Data Director", "Howell - Rippin", "Germany"],
                    ["Traci", "traci@example.com", "Corporate Identity Director", "Koelpin - Goldner", "Vanuatu"],
                    ["Kerry", "kerry@example.com", "Lead Applications Associate", "Feeney, Langworth and Tremblay", "Niger"],
                    ["Patsy", "patsy@example.com", "Dynamic Assurance Director", "Streich Group", "Niue"],
                    ["Cathy", "cathy@example.com", "Customer Data Director", "Ebert, Schamberger and Johnston", "Mexico"],
                    ["Tyrone", "tyrone@example.com", "Senior Response Liaison", "Raynor, Rolfson and Daugherty", "Qatar"],
                ]
            }).render(document.getElementById("table-search"));

        // Sorting Table
        if (document.getElementById("table-sorting"))
            new Grid({
                columns: ["Name", "Email", "Position", "Company", "Country"],
                pagination: {
                    limit: 5
                },
                sort: true,
                data: [
                    ["Jonathan", "jonathan@example.com", "Senior Implementation Architect", "Hauck Inc", "Holy See"],
                    ["Harold", "harold@example.com", "Forward Creative Coordinator", "Metz Inc", "Iran"],
                    ["Shannon", "shannon@example.com", "Legacy Functionality Associate", "Zemlak Group", "South Georgia"],
                    ["Robert", "robert@example.com", "Product Accounts Technician", "Hoeger", "San Marino"],
                    ["Noel", "noel@example.com", "Customer Data Director", "Howell - Rippin", "Germany"],
                    ["Traci", "traci@example.com", "Corporate Identity Director", "Koelpin - Goldner", "Vanuatu"],
                    ["Kerry", "kerry@example.com", "Lead Applications Associate", "Feeney, Langworth and Tremblay", "Niger"],
                    ["Patsy", "patsy@example.com", "Dynamic Assurance Director", "Streich Group", "Niue"],
                    ["Cathy", "cathy@example.com", "Customer Data Director", "Ebert, Schamberger and Johnston", "Mexico"],
                    ["Tyrone", "tyrone@example.com", "Senior Response Liaison", "Raynor, Rolfson and Daugherty", "Qatar"],
                ]
            }).render(document.getElementById("table-sorting"));


        // Loading State Table
        if (document.getElementById("table-loading-state"))
            new Grid({
                columns: ["Name", "Email", "Position", "Company", "Country"],
                pagination: {
                    limit: 5
                },
                sort: true,
                data: function () {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve([
                                ["Jonathan", "jonathan@example.com", "Senior Implementation Architect", "Hauck Inc", "Holy See"],
                                ["Harold", "harold@example.com", "Forward Creative Coordinator", "Metz Inc", "Iran"],
                                ["Shannon", "shannon@example.com", "Legacy Functionality Associate", "Zemlak Group", "South Georgia"],
                                ["Robert", "robert@example.com", "Product Accounts Technician", "Hoeger", "San Marino"],
                                ["Noel", "noel@example.com", "Customer Data Director", "Howell - Rippin", "Germany"],
                                ["Traci", "traci@example.com", "Corporate Identity Director", "Koelpin - Goldner", "Vanuatu"],
                                ["Kerry", "kerry@example.com", "Lead Applications Associate", "Feeney, Langworth and Tremblay", "Niger"],
                                ["Patsy", "patsy@example.com", "Dynamic Assurance Director", "Streich Group", "Niue"],
                                ["Cathy", "cathy@example.com", "Customer Data Director", "Ebert, Schamberger and Johnston", "Mexico"],
                                ["Tyrone", "tyrone@example.com", "Senior Response Liaison", "Raynor, Rolfson and Daugherty", "Qatar"]
                            ])
                        }, 2000);
                    });
                }
            }).render(document.getElementById("table-loading-state"));


        // Fixed Header
        if (document.getElementById("table-fixed-header"))
            new Grid({
                columns: ["Name", "Email", "Position", "Company", "Country"],
                sort: true,
                pagination: true,
                fixedHeader: true,
                height: '400px',
                data: [
                    ["Jonathan", "jonathan@example.com", "Senior Implementation Architect", "Hauck Inc", "Holy See"],
                    ["Harold", "harold@example.com", "Forward Creative Coordinator", "Metz Inc", "Iran"],
                    ["Shannon", "shannon@example.com", "Legacy Functionality Associate", "Zemlak Group", "South Georgia"],
                    ["Robert", "robert@example.com", "Product Accounts Technician", "Hoeger", "San Marino"],
                    ["Noel", "noel@example.com", "Customer Data Director", "Howell - Rippin", "Germany"],
                    ["Traci", "traci@example.com", "Corporate Identity Director", "Koelpin - Goldner", "Vanuatu"],
                    ["Kerry", "kerry@example.com", "Lead Applications Associate", "Feeney, Langworth and Tremblay", "Niger"],
                    ["Patsy", "patsy@example.com", "Dynamic Assurance Director", "Streich Group", "Niue"],
                    ["Cathy", "cathy@example.com", "Customer Data Director", "Ebert, Schamberger and Johnston", "Mexico"],
                    ["Tyrone", "tyrone@example.com", "Senior Response Liaison", "Raynor, Rolfson and Daugherty", "Qatar"],
                ]
            }).render(document.getElementById("table-fixed-header"));


        // Hidden Columns
        if (document.getElementById("table-hidden-column"))
            new Grid({
                columns: ["Name", "Email", "Position", "Company",
                    {
                        name: 'Country',
                        hidden: true
                    },
                ],
                pagination: {
                    limit: 5
                },
                sort: true,
                data: [
                    ["Jonathan", "jonathan@example.com", "Senior Implementation Architect", "Hauck Inc", "Holy See"],
                    ["Harold", "harold@example.com", "Forward Creative Coordinator", "Metz Inc", "Iran"],
                    ["Shannon", "shannon@example.com", "Legacy Functionality Associate", "Zemlak Group", "South Georgia"],
                    ["Robert", "robert@example.com", "Product Accounts Technician", "Hoeger", "San Marino"],
                    ["Noel", "noel@example.com", "Customer Data Director", "Howell - Rippin", "Germany"],
                    ["Traci", "traci@example.com", "Corporate Identity Director", "Koelpin - Goldner", "Vanuatu"],
                    ["Kerry", "kerry@example.com", "Lead Applications Associate", "Feeney, Langworth and Tremblay", "Niger"],
                    ["Patsy", "patsy@example.com", "Dynamic Assurance Director", "Streich Group", "Niue"],
                    ["Cathy", "cathy@example.com", "Customer Data Director", "Ebert, Schamberger and Johnston", "Mexico"],
                    ["Tyrone", "tyrone@example.com", "Senior Response Liaison", "Raynor, Rolfson and Daugherty", "Qatar"],
                ]
            }).render(document.getElementById("table-hidden-column"));


    }

}

document.addEventListener('DOMContentLoaded', function (e) {
    new GridDatatable().init();
});
