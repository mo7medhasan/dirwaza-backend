# Message to NoqoodyPay Support

## Subject: Request for Updated Sandbox API Credentials - Authentication Issue

Dear NoqoodyPay Support Team,

We are integrating NoqoodyPay payment gateway into our application (Dirwaza) and encountering authentication issues with our current sandbox credentials.

### Current Issue:
- **Error**: `invalid_grant - The user name or password is incorrect`
- **API Endpoint**: `https://noqoodypay.com/sdk/token`
- **Status Code**: 400

### Current Credentials (Not Working):
```
NOQOODY_BASE_URL=https://noqoodypay.com/sdk
NOQOODY_USERNAME=choices
NOQOODY_PASSWORD=mR*g96tQ@
NOQOODY_PROJECT_CODE=7Aq9Bt3431
NOQOODY_CLIENT_SECRET=2c@JzN8$oX*9W@3c
```

### What We've Implemented:
✅ **SecureHash Generation**: Correctly implemented according to documentation
- Format: `{CustomerEmail}{CustomerName}{CustomerMobile}{Description}{ProjectCode}{Reference}{Amount}`
- HMAC-SHA256 with Base64 encoding using CLIENT_SECRET

✅ **API Integration**: Complete implementation of:
- Payment link generation (`/api/PaymentLink/GenerateLinks`)
- Payment verification (`/api/Members/GetTransactionDetailStatusByClientReference/`)
- Payment channels (`/api/PaymentLink/PaymentChannels`)

✅ **Payment Redirect System**: Fully implemented callback handling for payment status updates

### Request:
Please provide updated **sandbox credentials** that are currently active:
1. Valid Username and Password
2. Active Project Code
3. Current Client Secret
4. Confirm correct API base URL

### Additional Information:
- **Application**: Dirwaza (Plant nursery and equestrian booking platform)
- **Integration Type**: Server-to-server API integration
- **Payment Types**: Plant orders, horse training bookings, resort bookings
- **Currency**: SAR (Saudi Riyal)

### Technical Details:
- **Implementation Language**: Node.js
- **Authentication Method**: OAuth 2.0 Bearer Token
- **Content Type**: application/json
- **Request Method**: POST for token, GET/POST for other endpoints

### Expected Response:
We need working sandbox credentials to:
1. Test payment link generation
2. Verify payment transactions
3. Test callback/redirect functionality
4. Complete integration testing before production deployment

Please provide the updated credentials at your earliest convenience, as this is blocking our payment integration testing.

Thank you for your assistance.

Best regards,
Dirwaza Development Team

---

## Arabic Version / النسخة العربية

### الموضوع: طلب بيانات اعتماد محدثة لبيئة الاختبار - مشكلة في المصادقة

فريق دعم NoqoodyPay المحترم،

نحن بصدد دمج بوابة الدفع NoqoodyPay في تطبيقنا (درواز) ونواجه مشاكل في المصادقة مع بيانات الاعتماد الحالية لبيئة الاختبار.

### المشكلة الحالية:
- **الخطأ**: `invalid_grant - The user name or password is incorrect`
- **نقطة النهاية**: `https://noqoodypay.com/sdk/token`
- **رمز الحالة**: 400

### بيانات الاعتماد الحالية (لا تعمل):
```
NOQOODY_BASE_URL=https://noqoodypay.com/sdk
NOQOODY_USERNAME=choices
NOQOODY_PASSWORD=mR*g96tQ@
NOQOODY_PROJECT_CODE=7Aq9Bt3431
NOQOODY_CLIENT_SECRET=2c@JzN8$oX*9W@3c
```

### ما تم تنفيذه:
✅ **توليد SecureHash**: تم تنفيذه بشكل صحيح وفقاً للوثائق
✅ **تكامل API**: تنفيذ كامل لجميع نقاط النهاية
✅ **نظام إعادة التوجيه**: تم تنفيذ معالجة callbacks بالكامل

### الطلب:
يرجى توفير **بيانات اعتماد محدثة لبيئة الاختبار** نشطة حالياً:
1. اسم مستخدم وكلمة مرور صالحة
2. رمز مشروع نشط
3. Client Secret حالي
4. تأكيد URL الصحيح للـ API

### معلومات إضافية:
- **التطبيق**: درواز (منصة حجز المشاتل والفروسية)
- **نوع التكامل**: تكامل API من خادم إلى خادم
- **أنواع الدفع**: طلبات النباتات، حجوزات التدريب، حجوزات الاستراحات
- **العملة**: ريال سعودي (SAR)

نحتاج بيانات الاعتماد العاملة لإكمال اختبار التكامل قبل النشر في الإنتاج.

شكراً لمساعدتكم.

مع أطيب التحيات،
فريق تطوير درواز
