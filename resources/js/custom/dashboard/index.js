/**
 * Dashboard Module
 * Handle date range filter, data fetching, and chart visualization
 */
import $ from "jquery";
import { route } from "ziggy-js";
import flatpickr from "flatpickr";
import ApexCharts from "apexcharts";
import { showToast, showError } from "../../core/notification";

let dateRangePicker = null;
let chartInstance = null;
let chartPoInstance = null;
let currentDateRange = {
    start: null,
    end: null
};

/**
 * Initialize date range picker
 */
function initDateRangePicker() {
    // Calculate 30 days ago
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    dateRangePicker = flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "d M Y",
        defaultDate: [thirtyDaysAgo, today],
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                currentDateRange.start = selectedDates[0];
                currentDateRange.end = selectedDates[1];
                fetchDashboardData();
            }
        },
        locale: {
            firstDayOfWeek: 1,
            weekdays: {
                shorthand: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
                longhand: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
            },
            months: {
                shorthand: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                longhand: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
            }
        }
    });

    // Set initial date range
    const dates = dateRangePicker.selectedDates;
    if (dates.length === 2) {
        currentDateRange.start = dates[0];
        currentDateRange.end = dates[1];
    }
}

/**
 * Fetch dashboard data from API
 */
function fetchDashboardData(showNotification = false) {
    const params = {};
    
    if (currentDateRange.start) {
        params.start_date = formatDate(currentDateRange.start);
    }
    if (currentDateRange.end) {
        params.end_date = formatDate(currentDateRange.end);
    }

    $.ajax({
        url: route('dashboard.data'),
        method: 'GET',
        data: params,
        beforeSend: function() {
            if (showNotification) {
                showToast('Memuat data dashboard...', 'info', 1500);
            }
        },
        success: function(response) {
            updateStatistics(response.statistics);
            updateProgress(response.progress);
            updateRecentPR(response.recent_pr);
            updateRecentPayments(response.recent_payments);
            updateChart(response.chart);
            
            if (showNotification) {
                showToast('Data dashboard berhasil dimuat!', 'success', 2000);
            }
        },
        error: function(xhr) {
            showError('Gagal memuat data dashboard', 'Error!');
            console.error('Dashboard fetch error:', xhr);
        }
    });
}

/**
 * Update statistics cards
 */
function updateStatistics(stats) {
    $('#stat-pr').text(stats.pr || 0);
    $('#stat-po').text(stats.po || 0);
    $('#stat-invoice').text(stats.invoice || 0);
    $('#stat-payment').text(stats.payment || 0);

    // Update badges (percentage from previous period - simplified to 0% for now)
    $('#pr-badge').text('+0%');
    $('#po-badge').text(stats.pr > 0 ? Math.round((stats.po / stats.pr) * 100) + '%' : '0%');
    $('#invoice-badge').text(stats.po > 0 ? Math.round((stats.invoice / stats.po) * 100) + '%' : '0%');
    $('#payment-badge').text(stats.invoice > 0 ? Math.round((stats.payment / stats.invoice) * 100) + '%' : '0%');
}

/**
 * Update progress bars
 */
function updateProgress(progress) {
    // PR to PO
    $('#progress-pr-po').text(progress.pr_to_po.percent + '%');
    $('#bar-pr-po').css('width', progress.pr_to_po.percent + '%');
    $('#count-pr-po').text(`${progress.pr_to_po.count} dari ${progress.pr_to_po.total}`);

    // PO to Invoice
    $('#progress-po-invoice').text(progress.po_to_invoice.percent + '%');
    $('#bar-po-invoice').css('width', progress.po_to_invoice.percent + '%');
    $('#count-po-invoice').text(`${progress.po_to_invoice.count} dari ${progress.po_to_invoice.total}`);

    // Invoice to Payment
    $('#progress-invoice-payment').text(progress.invoice_to_payment.percent + '%');
    $('#bar-invoice-payment').css('width', progress.invoice_to_payment.percent + '%');
    $('#count-invoice-payment').text(`${progress.invoice_to_payment.count} dari ${progress.invoice_to_payment.total}`);

    // Overall
    $('#progress-overall').text(progress.overall.percent + '%');
    $('#bar-overall').css('width', progress.overall.percent + '%');
}

/**
 * Update recent PR list
 */
function updateRecentPR(items) {
    const container = $('#recent-pr-list');
    
    if (items.length === 0) {
        container.html(`
            <div class="text-center py-8 text-gray-500">
                <i class="mgc_inbox_line text-3xl"></i>
                <p class="mt-2">Tidak ada data PR dalam periode ini</p>
            </div>
        `);
        return;
    }

    const html = items.map(item => `
        <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div class="flex-1">
                <p class="font-semibold text-sm text-gray-800 dark:text-white">${item.pr_number}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <i class="mgc_location_line"></i> ${item.location} • ${item.created_at}
                </p>
            </div>
            <div class="text-right">
                <span class="inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(item.status)}">
                    ${item.status}
                </span>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${item.created_by}</p>
            </div>
        </div>
    `).join('');
    
    container.html(html);
}

/**
 * Update recent payments list
 */
function updateRecentPayments(items) {
    const container = $('#recent-payment-list');
    
    if (items.length === 0) {
        container.html(`
            <div class="text-center py-8 text-gray-500">
                <i class="mgc_inbox_line text-3xl"></i>
                <p class="mt-2">Tidak ada data payment dalam periode ini</p>
            </div>
        `);
        return;
    }

    const html = items.map(item => `
        <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div class="flex-1">
                <p class="font-semibold text-sm text-gray-800 dark:text-white">${item.payment_number}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <i class="mgc_file_line"></i> ${item.invoice_number} • ${item.payment_date}
                </p>
            </div>
            <div class="text-right">
                <span class="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Paid
                </span>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${item.created_by}</p>
            </div>
        </div>
    `).join('');
    
    container.html(html);
}

/**
 * Update chart
 */
function updateChart(chartData) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const options = {
        series: chartData.series,
        chart: {
            type: 'line',
            height: 350,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'],
        stroke: {
            width: 3,
            curve: 'smooth'
        },
        markers: {
            size: 5,
            hover: {
                size: 7
            }
        },
        xaxis: {
            categories: chartData.categories,
            labels: {
                style: {
                    colors: '#64748B'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#64748B'
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: {
                colors: '#64748B'
            }
        },
        grid: {
            borderColor: '#E5E7EB',
            strokeDashArray: 4
        },
        tooltip: {
            theme: 'light',
            x: {
                show: true
            },
            y: {
                formatter: function(value) {
                    return value + ' items';
                }
            }
        }
    };

    chartInstance = new ApexCharts(document.querySelector("#chart-purchasing"), options);
    chartInstance.render();
}

/**
 * Get status class for badge
 */
function getStatusClass(status) {
    const statusMap = {
        'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        'Approved': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        'Completed': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Reset filter to default (last 30 days)
 */
function resetFilter() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    dateRangePicker.setDate([thirtyDaysAgo, today]);
    currentDateRange.start = thirtyDaysAgo;
    currentDateRange.end = today;
    
    fetchDashboardData(true);
}

/**
 * Fetch PO Analytics data (12 months)
 */
function fetchPoAnalytics() {
    $.ajax({
        url: route('dashboard.po-analytics'),
        method: 'GET',
        success: function(response) {
            renderPoChart(response);
        },
        error: function(xhr) {
            console.error('PO Analytics fetch error:', xhr);
            showError('Gagal memuat data analisis PO', 'Error!');
        }
    });
}

/**
 * Render PO Analytics Chart
 */
function renderPoChart(data) {
    if (chartPoInstance) {
        chartPoInstance.destroy();
    }

    const options = {
        chart: {
            height: 400,
            type: 'line',
            stacked: false,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        stroke: {
            width: [0, 3, 3],
            curve: 'smooth'
        },
        plotOptions: {
            bar: {
                columnWidth: '50%'
            }
        },
        colors: ['#3b82f6', '#8b5cf6', '#10b981'],
        series: data.series,
        fill: {
            opacity: [0.85, 1, 1],
            gradient: {
                inverseColors: false,
                shade: 'light',
                type: "vertical",
                opacityFrom: 0.85,
                opacityTo: 0.55,
                stops: [0, 100]
            }
        },
        labels: data.categories,
        markers: {
            size: [0, 4, 4],
            strokeWidth: 2,
            hover: {
                size: 6
            }
        },
        xaxis: {
            type: 'category',
            labels: {
                rotate: -45,
                rotateAlways: true,
                style: {
                    fontSize: '11px'
                }
            }
        },
        yaxis: [
            {
                title: {
                    text: 'Total Amount (Juta Rupiah)',
                    style: {
                        color: '#3b82f6'
                    }
                },
                labels: {
                    formatter: function(value) {
                        return 'Rp ' + value.toFixed(1) + ' Jt';
                    },
                    style: {
                        colors: '#3b82f6'
                    }
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Jumlah PO Items',
                    style: {
                        color: '#8b5cf6'
                    }
                },
                labels: {
                    formatter: function(value) {
                        return Math.round(value) + ' items';
                    },
                    style: {
                        colors: '#8b5cf6'
                    }
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Avg SLA Realisasi (%)',
                    style: {
                        color: '#10b981'
                    }
                },
                labels: {
                    formatter: function(value) {
                        return value.toFixed(1) + '%';
                    },
                    style: {
                        colors: '#10b981'
                    }
                },
                min: 0,
                max: 100
            }
        ],
        tooltip: {
            shared: true,
            intersect: false,
            y: [
                {
                    formatter: function(value) {
                        return 'Rp ' + value.toFixed(2) + ' Juta';
                    }
                },
                {
                    formatter: function(value) {
                        return Math.round(value) + ' items PO';
                    }
                },
                {
                    formatter: function(value) {
                        return value.toFixed(1) + '% (Avg SLA)';
                    }
                }
            ]
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            offsetY: 0,
            markers: {
                width: 12,
                height: 12,
                radius: 3
            }
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 3,
            padding: {
                top: 0,
                right: 30,
                bottom: 0,
                left: 10
            }
        }
    };

    chartPoInstance = new ApexCharts(document.querySelector("#chart-po-analytics"), options);
    chartPoInstance.render();
}

/**
 * Initialize dashboard
 */
$(document).ready(function() {
    initDateRangePicker();
    fetchDashboardData(false);
    fetchPoAnalytics();

    // Reset filter button
    $('#btn-reset-filter').on('click', function() {
        resetFilter();
    });
});
