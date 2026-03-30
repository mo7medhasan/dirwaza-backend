/**
 * Payment Status Monitor for Dirwaza
 * Monitors payment status and redirects users automatically
 */

class PaymentMonitor {
    constructor(options = {}) {
        this.frontendUrl = options.frontendUrl || 'https://dirwaza-ten.vercel.app';
        this.backendUrl = options.backendUrl || 'http://localhost:5001';
        this.checkInterval = options.checkInterval || 3000; // 3 seconds
        this.maxChecks = options.maxChecks || 20; // Max 1 minute
        this.currentChecks = 0;
        this.isMonitoring = false;
    }

    /**
     * Start monitoring payment status for a reference
     */
    startMonitoring(paymentReference) {
        if (this.isMonitoring) {
            console.log('🔄 Payment monitoring already active');
            return;
        }

        console.log('🔹 Starting payment monitoring for:', paymentReference);
        this.isMonitoring = true;
        this.currentChecks = 0;
        
        this.checkPaymentStatus(paymentReference);
    }

    /**
     * Check payment status via API
     */
    async checkPaymentStatus(paymentReference) {
        try {
            console.log(`🔹 Checking payment status (${this.currentChecks + 1}/${this.maxChecks}):`, paymentReference);
            
            const response = await fetch(`${this.backendUrl}/api/payment/verify-and-update/${paymentReference}`);
            const result = await response.json();
            
            console.log('🔹 Payment status result:', result);

            if (result.paymentStatus === 'paid') {
                this.handlePaymentSuccess(paymentReference);
                return;
            } else if (result.paymentStatus === 'failed') {
                this.handlePaymentFailed(paymentReference);
                return;
            }

            // Continue checking if still pending
            this.currentChecks++;
            if (this.currentChecks < this.maxChecks) {
                setTimeout(() => {
                    this.checkPaymentStatus(paymentReference);
                }, this.checkInterval);
            } else {
                this.handlePaymentTimeout(paymentReference);
            }

        } catch (error) {
            console.error('❌ Error checking payment status:', error);
            this.currentChecks++;
            
            if (this.currentChecks < this.maxChecks) {
                setTimeout(() => {
                    this.checkPaymentStatus(paymentReference);
                }, this.checkInterval);
            } else {
                this.handlePaymentError(paymentReference);
            }
        }
    }

    /**
     * Handle successful payment
     */
    handlePaymentSuccess(paymentReference) {
        console.log('✅ Payment successful:', paymentReference);
        this.isMonitoring = false;
        this.redirectToSite('success', paymentReference);
    }

    /**
     * Handle failed payment
     */
    handlePaymentFailed(paymentReference) {
        console.log('❌ Payment failed:', paymentReference);
        this.isMonitoring = false;
        this.redirectToSite('failed', paymentReference);
    }

    /**
     * Handle payment timeout
     */
    handlePaymentTimeout(paymentReference) {
        console.log('⏰ Payment status check timeout:', paymentReference);
        this.isMonitoring = false;
        this.redirectToSite('timeout', paymentReference);
    }

    /**
     * Handle payment check error
     */
    handlePaymentError(paymentReference) {
        console.log('🔧 Payment status check error:', paymentReference);
        this.isMonitoring = false;
        this.redirectToSite('error', paymentReference);
    }

    /**
     * Redirect to main site with status
     */
    redirectToSite(status, paymentReference) {
        const url = `${this.frontendUrl}/ar?payment=${status}&reference=${paymentReference}`;
        console.log('🔄 Redirecting to:', url);
        
        // Show notification before redirect
        this.showRedirectNotification(status);
        
        setTimeout(() => {
            window.location.href = url;
        }, 2000);
    }

    /**
     * Show redirect notification
     */
    showRedirectNotification(status) {
        const messages = {
            success: '✅ تم الدفع بنجاح',
            failed: '❌ فشل في عملية الدفع',
            timeout: '⏰ انتهت مهلة التحقق من الدفع',
            error: '🔧 خطأ في التحقق من حالة الدفع'
        };

        const message = messages[status] || '🔄 جاري المعالجة';
        
        // Create notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2196F3;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            font-family: Arial, sans-serif;
            font-size: 16px;
            direction: rtl;
        `;
        
        notification.textContent = `${message} - جاري العودة للموقع...`;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Auto-detect NoqoodyPay pages and start monitoring
     */
    autoDetectAndMonitor() {
        const url = window.location.href.toLowerCase();
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check if on NoqoodyPay failure page
        if (url.includes('3ds.noqoodypay.com/failed.html') || 
            url.includes('failure') || 
            url.includes('do_not_proceed')) {
            
            console.log('🔍 Detected NoqoodyPay failure page');
            
            // Try to extract reference from URL or localStorage
            const reference = urlParams.get('reference') || 
                            urlParams.get('ref') || 
                            localStorage.getItem('lastPaymentReference');
            
            if (reference) {
                this.startMonitoring(reference);
            } else {
                // Redirect immediately if no reference
                this.redirectToSite('failed', null);
            }
        }
        
        // Check if on NoqoodyPay success page
        else if (url.includes('success') || url.includes('completed')) {
            console.log('🔍 Detected NoqoodyPay success page');
            
            const reference = urlParams.get('reference') || 
                            urlParams.get('ref') || 
                            localStorage.getItem('lastPaymentReference');
            
            if (reference) {
                this.startMonitoring(reference);
            } else {
                this.redirectToSite('success', null);
            }
        }
    }
}

// Initialize payment monitor
const paymentMonitor = new PaymentMonitor();

// Auto-detect and monitor when page loads
document.addEventListener('DOMContentLoaded', () => {
    paymentMonitor.autoDetectAndMonitor();
});

// Also run immediately in case DOM is already loaded
paymentMonitor.autoDetectAndMonitor();

// Export for manual use
window.PaymentMonitor = PaymentMonitor;
window.paymentMonitor = paymentMonitor;

console.log('🏡 Dirwaza Payment Monitor loaded and ready');
