interface CheckoutVNConfig {
  apiToken: string;
  websiteId: number;
  gateId: number;
  baseUrl?: string;
}

interface OrderItem {
  item_name: string;
  item_quantity: number;
  item_price: number;
}

interface CreateTransactionRequest {
  website_id?: number;
  order_id: string;
  description?: string;
  pay_money: number;
  currency: string;
  contact_name?: string;
  contact_email?: string;
  contact_mobile?: string;
  status: number; // 0: Unpaid, 1: Paid
  gate_id: number;
  url_thanks?: string;
  url_cancel?: string;
  order_items: OrderItem[];
}

interface CreateTransactionResponse {
  error: boolean;
  id?: number;
  msg: string;
  payment_url?: string;
}

interface PaymentStatusRequest {
  order_id: string;
  website_id: number;
}

interface PaymentStatusResponse {
  error: boolean;
  msg: string;
  code: number;
  payment_status?: string;
  payment_transaction?: string;
  payment_text?: string;
  payment_method?: string;
  payment_gate?: string;
  payment_money?: number;
  payment_fee?: number;
  payment_revenue?: number;
  payment_time?: string;
}

export class CheckoutVN {
  private config: CheckoutVNConfig;
  private baseUrl: string;

  constructor(config: CheckoutVNConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://checkout.vn';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Token': this.config.apiToken,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && method === 'POST') {
      options.body = JSON.stringify(data);
    } else if (data && method === 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result as T;
    } catch (error) {
      console.error('CheckoutVN API Error:', error);
      throw error;
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(params: {
    orderId: string;
    amount: number;
    currency?: string;
    description?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    successUrl?: string;
    cancelUrl?: string;
    items: OrderItem[];
  }): Promise<CreateTransactionResponse> {
    const requestData: CreateTransactionRequest = {
      website_id: this.config.websiteId,
      order_id: params.orderId,
      description: params.description || `Payment for order ${params.orderId}`,
      pay_money: params.amount,
      currency: params.currency || 'VND',
      contact_name: params.customerName,
      contact_email: params.customerEmail,
      contact_mobile: params.customerPhone,
      status: 0, // Unpaid initially
      gate_id: this.config.gateId,
      url_thanks: params.successUrl,
      url_cancel: params.cancelUrl,
      order_items: params.items,
    };

    return this.makeRequest<CreateTransactionResponse>(
      '/api/transaction/create',
      'POST',
      requestData
    );
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    const requestData: PaymentStatusRequest = {
      order_id: orderId,
      website_id: this.config.websiteId,
    };

    return this.makeRequest<PaymentStatusResponse>(
      '/api/v1/getPaymentStatus',
      'GET',
      requestData
    );
  }

  /**
   * Check if a payment is completed
   */
  async isPaymentCompleted(orderId: string): Promise<boolean> {
    try {
      const status = await this.getPaymentStatus(orderId);
      return !status.error && status.payment_status === '1';
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }

  /**
   * Create a subscription payment
   */
  async createSubscriptionPayment(params: {
    userId: string;
    planName: string;
    amount: number;
    customerName?: string;
    customerEmail?: string;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<CreateTransactionResponse> {
    const orderId = `sub_${params.userId}_${Date.now()}`;
    
    return this.createTransaction({
      orderId,
      amount: params.amount,
      description: `Subscription: ${params.planName}`,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      items: [
        {
          item_name: params.planName,
          item_quantity: 1,
          item_price: params.amount,
        },
      ],
    });
  }
}

// Initialize CheckoutVN instance
export function createCheckoutVN(): CheckoutVN {
  const config: CheckoutVNConfig = {
    apiToken: process.env.CHECKOUT_VN_API_TOKEN!,
    websiteId: parseInt(process.env.CHECKOUT_VN_WEBSITE_ID!),
    gateId: parseInt(process.env.CHECKOUT_VN_GATE_ID!),
  };

  if (!config.apiToken || !config.websiteId || !config.gateId) {
    throw new Error('Missing required CheckoutVN configuration. Please set CHECKOUT_VN_API_TOKEN, CHECKOUT_VN_WEBSITE_ID, and CHECKOUT_VN_GATE_ID environment variables.');
  }

  return new CheckoutVN(config);
}