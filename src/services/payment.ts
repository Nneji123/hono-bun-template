import axios from 'axios';
import Stripe from 'stripe';

// Types and interfaces
type PaymentServiceType = 'korapay' | 'paystack' | 'stripe';

interface PaymentOptions {
  customerName?: string;
  successUrl?: string;
  cancelUrl?: string;
  [key: string]: any;
}

interface CustomerInfo {
  name: string;
  email: string;
}

interface PaymentMetadata {
  [key: string]: any;
}

interface PaymentResponse {
  [key: string]: any;
}

// Abstract class for payment services
abstract class PaymentInterface {
  abstract initiatePayment(
    amount: number,
    currency: string,
    email: string,
    reference: string,
    metadata: PaymentMetadata,
    options?: PaymentOptions
  ): Promise<PaymentResponse>;

  abstract verifyPayment(reference: string): Promise<PaymentResponse>;
}

// KoraPay service
class KoraPayService implements PaymentInterface {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.apiKey = process.env.NODE_ENV !== 'production'
      ? process.env.DEV_KORAPAY_SECRET_KEY!
      : process.env.KORAPAY_SECRET_KEY!;
    this.baseUrl = 'https://api.korapay.com/merchant/api/v1';
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async initiatePayment(
    amount: number,
    currency: string,
    email: string,
    reference: string,
    metadata: PaymentMetadata,
    options: PaymentOptions = {}
  ): Promise<PaymentResponse> {
    const url = `${this.baseUrl}/charges/initialize`;
    const payload = {
      amount,
      currency,
      reference,
      customer: {
        name: options.customerName || 'Anonymous',
        email
      },
      metadata
    };

    try {
      const response = await axios.post(url, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`KoraPay API error: ${error.message}`);
      }
      throw error;
    }
  }

  async verifyPayment(reference: string): Promise<PaymentResponse> {
    const url = `${this.baseUrl}/charges/${reference}`;
    try {
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`KoraPay verification error: ${error.message}`);
      }
      throw error;
    }
  }
}

// Paystack service
class PaystackService implements PaymentInterface {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.apiKey = process.env.NODE_ENV !== 'production'
      ? process.env.DEV_PAYSTACK_SECRET_KEY!
      : process.env.PAYSTACK_SECRET_KEY!;
    this.baseUrl = 'https://api.paystack.co';
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async initiatePayment(
    amount: number,
    currency: string,
    email: string,
    reference: string,
    metadata: PaymentMetadata,
    options: PaymentOptions = {}
  ): Promise<PaymentResponse> {
    const url = `${this.baseUrl}/transaction/initialize`;
    const payload = {
      amount: amount * 100,
      currency,
      email,
      reference,
      metadata
    };

    try {
      const response = await axios.post(url, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Paystack API error: ${error.message}`);
      }
      throw error;
    }
  }

  async verifyPayment(reference: string): Promise<PaymentResponse> {
    const url = `${this.baseUrl}/transaction/verify/${reference}`;
    try {
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Paystack verification error: ${error.message}`);
      }
      throw error;
    }
  }
}

// Stripe service
class StripeService implements PaymentInterface {
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.NODE_ENV !== 'production'
      ? process.env.DEV_STRIPE_SECRET_KEY!
      : process.env.STRIPE_SECRET_KEY!;
    this.stripe = new Stripe(apiKey, {
    });
  }

  async initiatePayment(
    amount: number,
    currency: string,
    email: string,
    reference: string,
    metadata: PaymentMetadata,
    options: PaymentOptions = {}
  ): Promise<PaymentResponse> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        client_reference_id: reference,
        line_items: [
          {
            price_data: {
              currency,
              product_data: { name: 'Payment' },
              unit_amount: amount * 100
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        customer_email: email,
        metadata,
        success_url: options.successUrl || process.env.PURCHASE_SUCCESS_URL!,
        cancel_url: options.cancelUrl || process.env.PURCHASE_CANCEL_URL!
      });
      return session;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Stripe API error: ${error.message}`);
      }
      throw error;
    }
  }

  async verifyPayment(sessionId: string): Promise<PaymentResponse> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Stripe verification error: ${error.message}`);
      }
      throw error;
    }
  }
}

// Main Payment Service
class PaymentService {
  private service: PaymentInterface;

  constructor(service: PaymentServiceType) {
    switch (service) {
      case 'korapay':
        this.service = new KoraPayService();
        break;
      case 'paystack':
        this.service = new PaystackService();
        break;
      case 'stripe':
        this.service = new StripeService();
        break;
      default:
        throw new Error(`Invalid payment service specified: ${service}`);
    }
  }

  async initiatePayment(
    amount: number,
    currency: string,
    email: string,
    reference: string,
    metadata: PaymentMetadata = {},
    options: PaymentOptions = {}
  ): Promise<PaymentResponse> {
    return await this.service.initiatePayment(
      amount,
      currency,
      email,
      reference,
      metadata,
      options
    );
  }

  async verifyPayment(reference: string): Promise<PaymentResponse> {
    return await this.service.verifyPayment(reference);
  }
}

export { 
  PaymentService,
  PaymentServiceType,
  PaymentOptions,
  PaymentMetadata,
  PaymentResponse 
};