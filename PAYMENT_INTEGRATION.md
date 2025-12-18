# Payment Integration Guide

## Current Implementation: Mock Payment Service

The application currently uses a **mock payment service** for development and testing. This allows you to test the complete tipping flow without integrating a real payment gateway.

### Mock Payment Service Features

- **90% success rate** - Simulates realistic payment scenarios
- **Random delays** - Simulates network latency (500-2000ms)
- **Transaction IDs** - Generates unique transaction IDs
- **Error handling** - Simulates payment failures

### File Location

The mock payment service is located at:
```
src/infrastructure/services/payment.service.ts
```

## Replacing with Qatari Payment Gateway

When you're ready to integrate your local Qatari payment gateway, follow these steps:

### Step 1: Update PaymentService

Replace the mock implementation in `src/infrastructure/services/payment.service.ts` with your real gateway integration.

**Key methods to implement:**

1. **`processPayment(request: PaymentRequest)`**
   - Create payment intent with gateway
   - Process the payment
   - Return payment response with transaction ID

2. **`verifyPayment(transactionId: string)`**
   - Verify transaction with gateway
   - Return payment status

3. **`refundPayment(transactionId: string, amount?: number)`**
   - Process refund through gateway
   - Return refund confirmation

### Step 2: Update Payment Provider

In `src/modules/tips/create/create-tip.use-case.ts`, update the payment provider:

```typescript
paymentProvider: 'LOCAL_GATEWAY', // Change to your gateway name
```

### Step 3: Environment Variables

Add your gateway credentials to `.env`:

```env
PAYMENT_GATEWAY_API_KEY=your_api_key
PAYMENT_GATEWAY_SECRET=your_secret
PAYMENT_GATEWAY_URL=https://api.gateway.com
```

### Step 4: Webhook Handling (Optional)

If your gateway supports webhooks, create a webhook handler:

```
app/api/webhooks/payment/route.ts
```

This should:
- Verify webhook signature
- Update tip payment status
- Handle payment failures

## Payment Flow

### Current Flow (Mock)

1. Customer fills tip form
2. Clicks "Continue to Payment"
3. Mock payment service processes payment (90% success)
4. Tip record created with transaction ID
5. Redirect to success page

### Real Gateway Flow

1. Customer fills tip form
2. Clicks "Continue to Payment"
3. **Create payment intent with gateway**
4. **Redirect to gateway payment page** (or use embedded form)
5. **Customer completes payment on gateway**
6. **Gateway redirects back with transaction ID**
7. **Verify payment with gateway**
8. Tip record created
9. Redirect to success page

## Testing

### Mock Payment Testing

- Success: 90% of payments succeed
- Failure: 10% of payments fail (simulates real-world scenarios)
- Transaction IDs: Format `txn_{timestamp}_{random}`

### Real Gateway Testing

- Use gateway's test/sandbox environment
- Test success scenarios
- Test failure scenarios
- Test refunds
- Test webhooks (if applicable)

## Integration Checklist

- [ ] Replace `PaymentService.processPayment()` with real gateway API call
- [ ] Replace `PaymentService.verifyPayment()` with real gateway verification
- [ ] Replace `PaymentService.refundPayment()` with real gateway refund
- [ ] Update payment provider name in tip creation
- [ ] Add gateway credentials to environment variables
- [ ] Create webhook handler (if needed)
- [ ] Update payment flow to redirect to gateway (if needed)
- [ ] Test payment success flow
- [ ] Test payment failure flow
- [ ] Test refund flow
- [ ] Test webhook handling (if applicable)

## Notes

- The payment service interface is designed to be easily swappable
- All payment processing happens in transactions for data consistency
- Payment status is stored in the `Tip` record
- Transaction IDs are stored for reconciliation
- The mock service can be kept for development/testing even after real integration

## Support

If you need help integrating your Qatari payment gateway, refer to:
- Your gateway's API documentation
- The existing mock implementation as a reference
- The payment service interface for required methods

