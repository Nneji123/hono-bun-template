import { PaymentService, PaymentServiceType } from '../src/services/payment';

const processPayment = async () => {
  const paymentGateway: PaymentServiceType = 'paystack'; // Change to 'korapay' or 'stripe' as needed

  const paymentService = new PaymentService(paymentGateway);

  try {
    const response = await paymentService.initiatePayment(
      5000, // Amount (e.g., $50.00 if currency is USD)
      'NGN', // Currency
      'customer@example.com', // Customer email
      'txn_12345678dsa0000p1929i21121i9080021po-0-k90j98j1112313ada99sa89890dq2-8asdds', // Unique transaction reference
      { orderId: 'ORDER_12345' }, // Metadata (Optional)
      { customerName: 'John Doe' } // Additional options (Optional)
    );

    console.log('Payment Initiated:', response);
  } catch (error) {
    console.error('Error initiating payment:', error);
  }
};

// Run the function
processPayment();
