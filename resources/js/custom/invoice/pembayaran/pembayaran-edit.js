import { showToast, showError } from '../../../core/notification';

// Initialize Flatpickr for payment date
function initFlatpickr() {
    const paymentDateInput = document.getElementById('payment_date');
    if (paymentDateInput && typeof flatpickr !== 'undefined') {
        flatpickr(paymentDateInput, {
            enableTime: false,
            dateFormat: 'Y-m-d',
            locale: 'id'
        });
    }
}

// Handle form submission for update
function handleFormSubmit() {
    const form = document.getElementById('pembayaranForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan...';
        
        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw { status: response.status, data: data };
                });
            }
            return response.json();
        })
        .then(data => {
            showToast('Pembayaran berhasil diperbarui', 'success');
            // Redirect ke index setelah 1 detik
            setTimeout(() => {
                window.location.href = '/pembayaran';
            }, 1000);
        })
        .catch(error => {
            let errorMessage = 'Terjadi kesalahan saat memperbarui pembayaran';
            
            if (error.data) {
                if (error.data.message) {
                    errorMessage = error.data.message;
                } else if (error.data.errors) {
                    errorMessage = Object.values(error.data.errors).flat().join(', ');
                }
            }
            
            showError(errorMessage);
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        });
    });
}

// Initialize all pembayaran edit functions
export function initPembayaranEdit() {
    initFlatpickr();
    handleFormSubmit();
}
