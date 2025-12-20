/**
 * Payment Service - Mock Implementation
 * 
 * This is a mock payment service for development/testing.
 * Replace this with your actual Qatari payment gateway integration.
 * 
 * The interface is designed to be easily swappable with a real payment gateway.
 */

export interface PaymentRequest {
  amount: number; // Amount in cents
  currency: string; // ISO currency code (e.g., "QAR")
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  message?: string;
}

export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Process a payment (mock implementation)
   * 
   * In production, this would:
   * 1. Create a payment intent with the gateway
   * 2. Process the payment
   * 3. Return the transaction result
   * 
   * For now, this simulates a payment with:
   * - 90% success rate
   * - Random delay (500-2000ms)
   * - Generated transaction ID
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1500 + 500));

    // Simulate payment success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      // Generate mock transaction ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      return {
        success: true,
        transactionId,
        amount: request.amount,
        currency: request.currency,
        status: 'SUCCEEDED',
        message: 'Payment processed successfully',
      };
    } else {
      return {
        success: false,
        transactionId: `txn_failed_${Date.now()}`,
        amount: request.amount,
        currency: request.currency,
        status: 'FAILED',
        message: 'Payment failed. Please try again.',
      };
    }
  }

  /**
   * Verify a payment transaction (mock implementation)
   * 
   * In production, this would verify the transaction with the gateway.
   */
  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock verification - assume all transactions are valid
    return {
      success: true,
      transactionId,
      amount: 0, // Would be fetched from gateway
      currency: 'QAR',
      status: 'SUCCEEDED',
      message: 'Transaction verified',
    };
  }

  /**
   * Refund a payment (mock implementation)
   * 
   * In production, this would process a refund through the gateway.
   */
  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      transactionId: `refund_${transactionId}`,
      amount: amount || 0,
      currency: 'QAR',
      status: 'SUCCEEDED',
      message: 'Refund processed successfully',
    };
  }
}

