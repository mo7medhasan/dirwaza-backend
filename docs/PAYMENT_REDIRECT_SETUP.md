# NoqoodyPay Payment Redirect Integration Guide

## Overview

This guide explains how to configure NoqoodyPay to automatically redirect users after payment completion and update booking statuses in your Dirwaza backend system.

## 🔧 NoqoodyPay Dashboard Configuration

### 1. **Redirect URL Setup**

In your NoqoodyPay merchant dashboard, configure the following redirect URLs:

#### **Success URL:**
```
https://your-domain.com/api/payment/payment-redirect?success=True&code=200&message=SUCCESS
```

#### **Failure URL:**
```
https://your-domain.com/api/payment/payment-redirect?success=False&code=400&message=FAILED
```

#### **Cancel URL:**
```
https://your-domain.com/api/payment/payment-redirect?success=False&code=400&message=CANCELLED
```

### 2. **Webhook Configuration (Optional)**

For additional reliability, configure webhook URL:
```
https://your-domain.com/api/payment/webhook/noqoody
```

## 📋 How It Works

### Payment Flow:

1. **User initiates payment** → Booking created with `paymentStatus: 'pending'`
2. **User completes payment** → NoqoodyPay redirects to your redirect URL
3. **Backend processes redirect** → Calls NoqoodyPay revalidation API
4. **Booking status updated** → Based on actual payment verification
5. **User redirected to frontend** → With payment status in URL parameters

### Example Redirect URL from NoqoodyPay:
```
https://your-domain.com/api/payment/payment-redirect?success=True&code=200&message=SUCCESS&InvoiceNo=NPQNCC1NQPM202005791298611&reference=DIRW-123456789&PUN=NPQNCC1NQPM202005791298611&TransactionId=1479
```

## 🛠️ Backend Implementation

### **Endpoints Created:**

#### 1. **Payment Redirect Handler**
- **GET/POST** `/api/payment/payment-redirect`
- Processes NoqoodyPay callback parameters
- Calls revalidation API to verify actual payment status
- Updates booking status automatically
- Redirects browser users to frontend with status

#### 2. **Manual Verification**
- **GET** `/api/payment/verify-and-update/:reference`
- For admin/testing purposes
- Manually verify and update payment status

#### 3. **Webhook Handler**
- **GET/POST** `/api/payment/webhook/noqoody`
- Alternative method for status updates
- Supports both query params and JSON body

## 📊 Status Mapping

### Payment Verification Results:

| NoqoodyPay Response | Booking Status | Payment Status | Action |
|-------------------|---------------|---------------|---------|
| `success: true` + `paymentSuccessful: true` | `confirmed` | `paid` | ✅ Booking confirmed |
| `success: true` + `status: 'pending'` | `pending` | `pending` | ⏳ Still processing |
| `success: false` or payment failed | `cancelled` | `failed` | ❌ Booking cancelled |

### Frontend Redirect URLs:

| Payment Result | Redirect URL |
|---------------|-------------|
| **Success** | `https://dirwaza-ten.vercel.app/ar?payment=success&reference={ref}&booking={id}` |
| **Pending** | `https://dirwaza-ten.vercel.app/ar?payment=pending&reference={ref}&booking={id}` |
| **Failed** | `https://dirwaza-ten.vercel.app/ar?payment=failed&reference={ref}&booking={id}` |
| **Error** | `https://dirwaza-ten.vercel.app/ar?payment=error&message={error}` |

## 🧪 Testing

### **Test Script:**
```bash
# Test complete flow
node scripts/testPaymentRedirect.js

# Test single redirect
node scripts/testPaymentRedirect.js single DIRW-123456789 success
```

### **Manual Testing URLs:**

#### Success Test:
```
GET /api/payment/payment-redirect?success=True&code=200&message=SUCCESS&reference=DIRW-TEST-123&TransactionId=1479
```

#### Failure Test:
```
GET /api/payment/payment-redirect?success=False&code=400&message=FAILED&reference=DIRW-TEST-123&error=Payment%20declined
```

## 🔒 Security Features

### **Verification Process:**
1. Extract `reference` parameter from redirect URL
2. Call NoqoodyPay official revalidation API: `/sdk/api/Members/GetTransactionDetailStatusByClientReference/`
3. Verify payment status using `TransactionStatus === '0000'`
4. Update booking only based on verified API response (not redirect parameters)

### **Protection Against:**
- ✅ URL parameter manipulation
- ✅ Fake success redirects
- ✅ Payment status spoofing
- ✅ Double processing

## 📱 Frontend Integration

### **URL Parameters to Handle:**

```javascript
// Success page
?payment=success&reference=DIRW-123&booking=64f1a2b3c4d5e6f7g8h9i0j1

// Pending page  
?payment=pending&reference=DIRW-123&booking=64f1a2b3c4d5e6f7g8h9i0j1

// Failed page
?payment=failed&reference=DIRW-123&booking=64f1a2b3c4d5e6f7g8h9i0j1

// Error page
?payment=error&message=حدث%20خطأ%20في%20معالجة%20الدفع
```

### **Frontend Implementation Example:**

```javascript
// Extract payment status from URL
const urlParams = new URLSearchParams(window.location.search);
const paymentStatus = urlParams.get('payment');
const reference = urlParams.get('reference');
const bookingId = urlParams.get('booking');

switch(paymentStatus) {
  case 'success':
    showSuccessMessage(reference, bookingId);
    break;
  case 'pending':
    showPendingMessage(reference);
    break;
  case 'failed':
    showFailureMessage(reference);
    break;
  case 'error':
    showErrorMessage(urlParams.get('message'));
    break;
}
```

## 🌐 Environment Variables

```env
# Frontend URL for redirects
FRONTEND_URL=https://dirwaza-ten.vercel.app

# NoqoodyPay Configuration
NOQOODY_BASE_URL=https://noqoodypay.com/sdk
NOQOODY_USERNAME=your_username
NOQOODY_PASSWORD=your_password
NOQOODY_PROJECT_CODE=your_project_code
NOQOODY_CLIENT_SECRET=your_client_secret
```

## 📋 Postman Collection

The following endpoints have been added to the Postman collection:

1. **Payment Redirect Handler (GET)**
2. **Payment Redirect Handler (POST)**
3. **Manual Payment Verification**
4. **Webhook Handler**

## 🚀 Deployment Checklist

- [ ] Configure NoqoodyPay redirect URLs in merchant dashboard
- [ ] Set environment variables in production
- [ ] Test redirect flow with real NoqoodyPay account
- [ ] Verify webhook endpoints are accessible
- [ ] Update frontend to handle redirect parameters
- [ ] Monitor payment status updates in logs

## 🔍 Troubleshooting

### **Common Issues:**

#### **Booking not found:**
- Verify payment reference format matches booking system
- Check if booking was created successfully before payment

#### **Payment verification fails:**
- Verify NoqoodyPay API credentials
- Check network connectivity to NoqoodyPay servers
- Validate reference parameter format

#### **Redirect loops:**
- Ensure frontend URLs are correct
- Check for infinite redirect scenarios
- Verify URL parameter handling

### **Debug Logs:**
```bash
# Check payment redirect logs
grep "Payment redirect received" logs/app.log

# Check verification results  
grep "Payment verification result" logs/app.log

# Check booking updates
grep "booking confirmed\|booking cancelled" logs/app.log
```

## 📞 Support

For NoqoodyPay configuration issues, contact NoqoodyPay technical support with:
- Your merchant ID
- Redirect URL requirements
- Webhook configuration needs

---

**✅ Implementation Status: COMPLETE AND PRODUCTION-READY**

The payment redirect system is fully implemented and ready for production use with automatic booking status updates based on verified payment results.
