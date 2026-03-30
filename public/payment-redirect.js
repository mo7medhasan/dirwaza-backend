// Dirwaza Payment Redirect Handler
(function() {
    const FRONTEND_URL = 'https://dirwaza-ten.vercel.app';
    
    function isNoqoodyPayPage() {
        const url = window.location.href.toLowerCase();
        return url.includes('3ds.noqoodypay.com') || 
               url.includes('failure') || 
               url.includes('do_not_proceed');
    }
    
    function redirect() {
        if (isNoqoodyPayPage()) {
            console.log('🔄 Redirecting from NoqoodyPay to main site...');
            setTimeout(() => {
                window.location.href = `${FRONTEND_URL}/ar?payment=failed`;
            }, 2000);
        }
    }
    
    // Run redirect check
    redirect();
    
    // Also check after page load
    window.addEventListener('load', redirect);
})();
