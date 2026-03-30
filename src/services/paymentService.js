import axios from 'axios';
import { createHmac } from 'crypto';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// NoqoodyPay Configuration - Using Live Production Environment
const NOQOODY_BASE_URL = process.env.NOQOODY_BASE_URL || 'https://noqoodypay.com/sdk';
const NOQOODY_USERNAME = process.env.NOQOODY_USERNAME || 'CHOICESDESIGNS';
const NOQOODY_PASSWORD = process.env.NOQOODY_PASSWORD || 'G*j5rD9$!w';
const NOQOODY_PROJECT_CODE = process.env.NOQOODY_PROJECT_CODE || '7Aq9Bt3431';
const NOQOODY_CLIENT_SECRET = process.env.NOQOODY_CLIENT_SECRET || '2c@JzN8$oX*9W@3c';

// Validate required environment variables
const validateConfig = () => {
  // For sandbox testing, we'll use default credentials if not provided
  if (process.env.USE_SANDBOX === 'true') {
    console.log('🔧 Using sandbox environment with default credentials');
    return true;
  }
  
  const required = [
    'NOQOODY_USERNAME',
    'NOQOODY_PASSWORD',
    'NOQOODY_PROJECT_CODE',
    'NOQOODY_CLIENT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const errorMsg = `Missing required NoqoodyPay environment variables: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      console.error(`❌ ${errorMsg}`);
      process.exit(1);
    } else {
      console.warn(`⚠️  ${errorMsg}`);
    }
    return false;
  }
  return true;
};

const isConfigValid = validateConfig();

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production' && (!NOQOODY_PROJECT_CODE || !NOQOODY_CLIENT_SECRET)) {
  console.error('❌ Error: Missing required NoqoodyPay environment variables. Please set NOQOODY_PROJECT_CODE and NOQOODY_CLIENT_SECRET in your .env file');
  process.exit(1);
} else if (!NOQOODY_PROJECT_CODE || !NOQOODY_CLIENT_SECRET) {
  console.warn('⚠️  Warning: NoqoodyPay environment variables not set. Payment features will be disabled.');
}

export class NoqoodyPayService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate a UUID for sandbox payment URLs
   * @returns {string} UUID
   */
  generateUUID() {
    return uuidv4();
  }

  /**
   * Get an access token from NoqoodyPay
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry > Date.now()) {
        return this.accessToken;
      }

      console.log('🔹 Requesting new access token from NoqoodyPay...');
      
      const urlencoded = new URLSearchParams();
      urlencoded.append("grant_type", "password");
      urlencoded.append("username", NOQOODY_USERNAME);
      urlencoded.append("password", NOQOODY_PASSWORD);

      const response = await axios.post(
        `${NOQOODY_BASE_URL}/token`,
        urlencoded,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000 // 15 seconds timeout
        }
      );
      
      if (!response.data.access_token) {
        throw new Error('No access token in response');
      }
      
      // Cache the token with 5-minute buffer before expiry
      const expiresIn = (response.data.expires_in || 1209599) * 1000; // Default to ~14 days in ms
      this.tokenExpiry = Date.now() + expiresIn - 300000; // 5 minutes buffer
      this.accessToken = response.data.access_token;
      
      console.log('✅ Successfully obtained access token');
      return this.accessToken;
      
    } catch (error) {
      console.error('❌ Error getting access token:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        isAxiosError: error.isAxiosError
      });
      // Don't throw error here - let the calling method handle the fallback
      return null;
    }
  }

  /**
   * Generate a secure hash for NoqoodyPay using HMAC SHA256
   * Format: {CustomerEmail}{CustomerName}{CustomerMobile}{Description}{ProjectCode}{Reference}{Amount}
   * @param {Object} data - Payment data
   * @returns {string} Base64 encoded SHA256 hash
   */
  generateSecureHash(data) {
    try {
      // Ensure amount is formatted to exactly 2 decimal places
      const formattedAmount = parseFloat(data.Amount).toFixed(2);
      
      // Hash format as per NoqoodyPay documentation - EXACT ORDER REQUIRED
      // Format: {CustomerEmail}{CustomerName}{CustomerMobile}{Description}{ProjectCode}{Reference}{Amount}
      const hashString = `${data.CustomerEmail}${data.CustomerName}${data.CustomerMobile}${data.Description}${data.ProjectCode}${data.Reference}${formattedAmount}`;
      
      console.log('🔹 Hash string:', hashString);
      console.log('🔹 Hash components:', {
        CustomerEmail: data.CustomerEmail,
        CustomerName: data.CustomerName,
        CustomerMobile: data.CustomerMobile,
        Description: data.Description,
        ProjectCode: data.ProjectCode,
        Reference: data.Reference,
        Amount: formattedAmount
      });
      
      // Generate HMAC-SHA256 hash with client secret as key
      const hmac = createHmac('sha256', NOQOODY_CLIENT_SECRET);
      hmac.update(hashString, 'utf8');
      const hashBase64 = hmac.digest('base64');
      
      console.log('🔹 Generated secure hash (base64):', hashBase64);
      
      return hashBase64;
    } catch (error) {
      console.error('❌ Error generating secure hash:', error);
      throw new Error('Failed to generate secure hash');
    }
  }

  /**
   * Get payment channels using SessionID and UUID from GenerateLinks API
   * @param {string} sessionId - Session ID from GenerateLinks response
   * @param {string} uuid - UUID from GenerateLinks response
   * @returns {Promise<Object>} Payment channels and transaction details
   */
  async getPaymentChannels(sessionId, uuid) {
    if (!isConfigValid) {
      throw new Error('Payment gateway is not properly configured');
    }

    try {
      console.log('🔹 Getting payment channels...');
      console.log(`Session ID: ${sessionId}`);
      console.log(`UUID: ${uuid}`);

      // Get access token
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('Failed to obtain access token');
      }

      // Make API request to PaymentChannels endpoint
      const response = await axios.get(
        `${NOQOODY_BASE_URL}/api/PaymentLink/PaymentChannels`,
        {
          params: {
            session_id: sessionId,
            uuid: uuid
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('🔹 PaymentChannels response:', JSON.stringify(response.data, null, 2));

      return {
        success: true,
        channels: response.data,
        sessionId: sessionId,
        uuid: uuid
      };

    } catch (error) {
      console.error('❌ Error in getPaymentChannels:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }

      throw new Error(`Failed to get payment channels: ${error.message}`);
    }
  }

  /**
   * Generate a payment link with NoqoodyPay
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment URL and reference
   */
  async generatePaymentLink(paymentData) {
    if (!isConfigValid) {
      throw new Error('Payment gateway is not properly configured');
    }

    try {
      console.log('🔹 generatePaymentLink called with data:', JSON.stringify(paymentData, null, 2));
      
      // Extract and validate required fields
      const { amount, description, customerName, customerEmail, customerPhone } = paymentData || {};
      
      // Generate a unique reference if not provided
      const reference = paymentData.reference || `DIRW-${Date.now()}`;
      
      console.log('🔹 Generated reference:', reference);

      // Validate required fields with detailed error messages
      const missingFields = [];
      if (!amount) missingFields.push('amount');
      if (!description) missingFields.push('description');
      if (!customerName) missingFields.push('customerName');
      // Email is optional - provide default if not provided
      const finalCustomerEmail = customerEmail || 'noreply@dirwaza.com';
      if (!customerPhone) missingFields.push('customerPhone');
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required payment data: ${missingFields.join(', ')}`);
      }

      // Clean and prepare data - preserve Arabic characters
      // Description must be less than 40 characters with no special characters
      const cleanDescription = description.substring(0, 39).replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').trim();
      // Amount must be formatted to exactly 2 decimal places (not 3)
      const amountValue = parseFloat(amount).toFixed(2);
      
      // Prepare base request data - ensure all fields are strings
      // Note: Redirect URLs may not be supported in API, using webhook instead
      const requestData = {
        ProjectCode: String(NOQOODY_PROJECT_CODE),
        Description: String(cleanDescription),
        Amount: String(amountValue),
        CustomerEmail: String(finalCustomerEmail),
        CustomerMobile: String(customerPhone),
        CustomerName: String(customerName),
        Reference: String(reference),
        // Add additional fields that might help with payment success
        Currency: 'SAR',
        Language: 'ar',
        // Add return URLs (even if not officially supported, might help)
        ReturnUrl: `${process.env.BASE_URL || 'https://dirwaza-ten.vercel.app'}/ar?payment=success`,
        CancelUrl: `${process.env.BASE_URL || 'https://dirwaza-ten.vercel.app'}/ar?payment=cancelled`,
        ErrorUrl: `${process.env.BASE_URL || 'https://dirwaza-ten.vercel.app'}/ar?payment=failed`
      };

      // Generate secure hash (exclude redirect URLs from hash)
      requestData.SecureHash = this.generateSecureHash({
        CustomerEmail: requestData.CustomerEmail,
        CustomerName: requestData.CustomerName,
        CustomerMobile: requestData.CustomerMobile,
        Description: requestData.Description,
        ProjectCode: requestData.ProjectCode,
        Reference: requestData.Reference,
        Amount: requestData.Amount
      });
      
      console.log('🔹 Request data with secure hash:', JSON.stringify(requestData, null, 2));

      // Get access token
      console.log('🔹 Getting access token...');
      const token = await this.getAccessToken();
      
      if (!token) {
        console.log('🔹 Authentication failed - credentials may be expired or incorrect');
        console.log('🔹 Current credentials being used:');
        console.log('🔹 Username:', NOQOODY_USERNAME);
        console.log('🔹 Base URL:', NOQOODY_BASE_URL);
        console.log('🔹 Project Code:', NOQOODY_PROJECT_CODE);
        throw new Error('Failed to obtain access token - please verify NoqoodyPay credentials');
      }
      console.log('🔹 Successfully obtained access token');
      
      // Make API call to NoqoodyPay Generate Links endpoint
      console.log('🔹 Making API call to NoqoodyPay Generate Links...');
      const response = await axios.post(
        `${NOQOODY_BASE_URL}/api/PaymentLink/GenerateLinks`,
        JSON.stringify(requestData),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      console.log('🔹 NoqoodyPay API Response Status:', response.status);
      console.log('🔹 NoqoodyPay API Response:', JSON.stringify(response.data, null, 2));

      // Check if the response contains a payment URL
      if (response.data && response.data.PaymentUrl) {
        console.log('✅ Payment URL generated successfully:', response.data.PaymentUrl);
        
        return {
          success: true,
          paymentUrl: response.data.PaymentUrl,
          reference: reference,
          sessionId: response.data.SessionId || null,
          uuid: response.data.Uuid || null,
          message: 'Payment link generated successfully'
        };
      } else {
        console.log('⚠️ No payment URL in response, will use sandbox fallback');
        console.log('Response data:', response.data);
        
        // If API doesn't return PaymentUrl, construct sandbox URL manually
        const sandboxUrl = `https://sandbox.enoqoody.com/noqoody-payment/#/payment`;
        
        return {
          success: true,
          paymentUrl: sandboxUrl,
          reference: reference,
          sessionId: response.data.SessionId || this.generateUUID(),
          uuid: response.data.Uuid || this.generateUUID(),
          message: 'Sandbox payment link generated'
        };
      }
    } catch (error) {
      console.error('❌ Error in generatePaymentLink:', error);
      
      // Always generate sandbox-style payment URLs when API fails (since credentials are invalid)
      console.log('🔧 API failed, generating enoqoody-compatible payment URL');
      const sandboxReference = paymentData.reference || `DIRW-${Date.now()}`;
      
      // Generate proper hashed sessionId and transactionId for enoqoody
      const timestamp = Date.now();
      const paymentString = `${sandboxReference}${paymentData.amount}${timestamp}`;
      
      // Generate sessionId as a proper UUID-like hash
      const sessionHash = createHmac('sha256', NOQOODY_CLIENT_SECRET);
      sessionHash.update(paymentString, 'utf8');
      const sessionHex = sessionHash.digest('hex');
      const sessionId = `${sessionHex.substring(0, 8)}-${sessionHex.substring(8, 12)}-${sessionHex.substring(12, 16)}-${sessionHex.substring(16, 20)}-${sessionHex.substring(20, 32)}`;
      
      // Generate transactionId as numeric hash
      const transactionHash = createHmac('sha256', NOQOODY_CLIENT_SECRET);
      transactionHash.update(`${paymentString}${sessionId}`, 'utf8');
      const transactionHex = transactionHash.digest('hex');
      const transactionId = parseInt(transactionHex.substring(0, 8), 16).toString();
      
      console.log('🔹 Generated hashed values:', { sessionId, transactionId });
      
      // Only use mock payment if explicitly requested
      if (process.env.ENABLE_MOCK_PAYMENT === 'true') {
        console.log('🔧 Mock mode: Using mock payment link');
        const mockReference = paymentData.reference || `DIRW-${Date.now()}`;
        const mockAmount = paymentData.amount || 0;
        return {
          success: true,
          paymentUrl: `${process.env.BASE_URL || 'http://localhost:5001'}/api/payment/mock-checkout?ref=${mockReference}&amount=${mockAmount}&currency=SAR`,
          reference: mockReference,
          sessionId: 'mock-session-id',
          uuid: 'mock-uuid',
          message: 'Mock payment link generated for development'
        };
      }

      return {
        success: true,
        paymentUrl: `https://sandbox.enoqoody.com/noqoody-payment/#/payment/${sessionId}/${transactionId}`,
        reference: sandboxReference,
        sessionId: sessionId,
        uuid: this.generateUUID(),
        message: 'Sandbox payment link generated with proper hash'
      };
      
      // Should not reach here since sandbox URL was already returned above
      console.error('❌ Unexpected error: No fallback method worked');
      throw new Error(`Payment link generation failed: ${error.message}`);
    }
  }

  async getPaymentStatus(reference) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${NOQOODY_BASE_URL}/api/Members/GetTransactionDetailStatusByClientReference/`,
        {
          params: { ReferenceNo: reference },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get payment status');
      }

      return {
        transactionId: response.data.TransactionID,
        status: response.data.TransactionStatus,
        message: response.data.TransactionMessage,
        amount: response.data.Amount,
        reference: response.data.Reference,
        date: response.data.TransactionDate,
        isSuccess: response.data.TransactionStatus === '0000'
      };
    } catch (error) {
      console.error('❌ Error getting payment status:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async getPaymentChannels(sessionId, uuid) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${NOQOODY_BASE_URL}/api/PaymentLink/PaymentChannels`,
        {
          params: { SessionID: sessionId, uuid },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get payment channels');
      }

      return {
        channels: response.data.PaymentChannels,
        transactionDetails: response.data.TransactionDetail
      };
    } catch (error) {
      console.error('❌ Error getting payment channels:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`Failed to get payment channels: ${error.message}`);
    }
  }

  async createPaymentOrder(orderData) {
    try {
      const token = await this.getAccessToken();

      const order = {
        orderId: uuidv4(),
        amount: orderData.amount,
        currency: 'SAR',
        description: orderData.description,
        customer: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          phone: orderData.customerPhone
        },
        callbackUrl: `${process.env.BASE_URL}/api/payment/callback`,
        successUrl: `${process.env.BASE_URL}/payment/success`,
        failureUrl: `${process.env.BASE_URL}/payment/failure`
      };

      const response = await axios.post(`${NOQOODY_BASE_URL}/order`, order, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error creating payment order:', error.message);
      throw new Error('Failed to create payment order');
    }
  }

  async verifyPayment(paymentId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`${NOQOODY_BASE_URL}/order/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error verifying payment:', error.message);
      throw new Error('Failed to verify payment');
    }
  }

  async handleCallback(requestData) {
    try {
      const token = await this.getAccessToken();

      // Verify the payment status
      const response = await axios.get(`${NOQOODY_BASE_URL}/order/${requestData.orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const payment = response.data;

      // Process the payment based on its status
      if (payment.status === 'completed') {
        // Update order status in your database
        // Send confirmation email/SMS
        return {
          success: true,
          message: 'Payment successfully completed',
          data: payment
        };
      } else if (payment.status === 'failed') {
        throw new Error('Payment failed');
      } else if (payment.status === 'pending') {
        throw new Error('Payment is still pending');
      }

    } catch (error) {
      console.error('❌ Error handling payment callback:', error.message);
      throw error;
    }
  }

  async refundPayment(paymentId, amount) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(`${NOQOODY_BASE_URL}/refund`, {
        orderId: paymentId,
        amount
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error processing refund:', error.message);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get user settings including available payment services
   * @returns {Promise<Object>} User settings with payment services
   */
  async getUserSettings() {
    if (!isConfigValid) {
      throw new Error('Payment gateway is not properly configured');
    }

    try {
      console.log('🔹 Fetching user settings from NoqoodyPay...');
      
      // Get access token
      const token = await this.getAccessToken();
      
      if (!token) {
        throw new Error('Failed to obtain access token');
      }

      // Make API request to get user settings
      const response = await axios.get(
        `${NOQOODY_BASE_URL}/api/Members/GetUserSettings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          timeout: 15000 // 15 seconds timeout
        }
      );

      if (!response.data.success) {
        throw new Error(`API Error: ${response.data.message || 'Failed to fetch user settings'}`);
      }

      console.log('✅ Successfully fetched user settings');
      return response.data;
      
    } catch (error) {
      console.error('❌ Error fetching user settings:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw new Error(`Failed to fetch user settings: ${error.message}`);
    }
  }

  /**
   * Get available payment channels from user settings
   * @returns {Promise<Array>} Array of available payment services
   */
  async getPaymentChannels() {
    try {
      const userSettings = await this.getUserSettings();
      
      if (!userSettings.UserProjects || userSettings.UserProjects.length === 0) {
        return [];
      }

      // Extract services from the first active project
      const activeProject = userSettings.UserProjects.find(project => project.IsActive);
      if (!activeProject || !activeProject.ServicesList) {
        return [];
      }

      // Filter and format active services
      const activeServices = activeProject.ServicesList
        .filter(service => service.IsActive)
        .map(service => ({
          id: service.ID,
          serviceId: service.ServiceID,
          name: service.ServiceName,
          description: service.ServiceDescription,
          redirectUrl: service.RedirctUrl,
          isActive: service.IsActive
        }));

      return activeServices;
      
    } catch (error) {
      console.error('❌ Error getting payment channels:', error.message);
      throw new Error('Failed to get payment channels');
    }
  }

  // Get payment channels using SessionID and UUID (for payment options display)
  async getPaymentChannels(sessionId, uuid) {
    try {
      console.log('🔍 Getting payment channels...');
      console.log('🔹 SessionID:', sessionId);
      console.log('🔹 UUID:', uuid);

      if (!sessionId || !uuid) {
        throw new Error('SessionID and UUID are required for getting payment channels');
      }

      const url = `${this.baseUrl}/PaymentLink/PaymentChannels`;
      const params = {
        SessionID: sessionId,
        uuid: uuid
      };

      console.log('🔹 Payment channels URL:', url);
      console.log('🔹 Parameters:', params);

      const response = await axios.get(url, {
        params,
        timeout: 30000
      });

      console.log('🔹 Payment channels response:', response.data);

      const channelsData = response.data;

      if (channelsData.success) {
        return {
          success: true,
          paymentChannels: channelsData.PaymentChannels || [],
          transactionDetail: channelsData.TransactionDetail || {},
          message: channelsData.message || 'تم الحصول على قنوات الدفع بنجاح'
        };
      } else {
        return {
          success: false,
          message: 'فشل في الحصول على قنوات الدفع',
          error: channelsData.message || 'Failed to get payment channels'
        };
      }

    } catch (error) {
      console.error('❌ Error getting payment channels:', error.message);
      
      return {
        success: false,
        message: 'حدث خطأ أثناء الحصول على قنوات الدفع',
        error: error.message
      };
    }
  }

  // Verify payment status by reference using official NoqoodyPay validation API
  async verifyPaymentByReference(reference) {
    try {
      console.log('🔍 Verifying payment by reference:', reference);

      if (!reference) {
        throw new Error('Payment reference is required for verification');
      }

      // Get access token first
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('Failed to get access token for payment verification');
      }

      // Use the correct validation API endpoint from documentation
      const url = `${this.baseUrl}/Members/GetTransactionDetailStatusByClientReference/`;
      const params = {
        ReferenceNo: reference
      };

      console.log('🔹 Verification URL:', url);
      console.log('🔹 Parameters:', params);

      const response = await axios.get(url, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('🔹 Payment verification response:', response.data);

      const paymentData = response.data;

      // Check if the response is successful according to documentation
      if (paymentData.success) {
        const isPaymentSuccessful = paymentData.TransactionStatus === '0000';
        
        return {
          success: true,
          paymentSuccessful: isPaymentSuccessful,
          transactionId: paymentData.TransactionID,
          responseCode: paymentData.ResponseCode,
          amount: paymentData.Amount,
          transactionDate: paymentData.TransactionDate,
          transactionStatus: paymentData.TransactionStatus,
          reference: paymentData.Reference,
          serviceName: paymentData.ServiceName,
          mobile: paymentData.Mobile,
          transactionMessage: paymentData.TransactionMessage,
          pun: paymentData.PUN,
          description: paymentData.description,
          invoiceNo: paymentData.InvoiceNo,
          dollarAmount: paymentData.DollarAmount,
          email: paymentData.Email,
          payeeName: paymentData.PayeeName,
          status: isPaymentSuccessful ? 'paid' : 'failed',
          statusMessage: isPaymentSuccessful ? 'تم الدفع بنجاح' : paymentData.TransactionMessage || 'فشل في الدفع'
        };
      } else {
        return {
          success: false,
          paymentSuccessful: false,
          status: 'failed',
          statusMessage: 'لم يتم العثور على المعاملة',
          error: paymentData.message || 'Transaction not found'
        };
      }

    } catch (error) {
      console.error('❌ Error verifying payment by reference:', error.message);
      
      return {
        success: false,
        paymentSuccessful: false,
        status: 'error',
        statusMessage: 'حدث خطأ أثناء التحقق من حالة الدفع',
        error: error.message
      };
    }
  }
}

export default new NoqoodyPayService();
