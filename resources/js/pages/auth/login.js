import { showToast } from '../../core/notification';

document.addEventListener('DOMContentLoaded', () => {
    const message = window.loginErrorMessage;
    if (message) {
        showToast(message, 'error', 4000, 'top-end');
    }
});
