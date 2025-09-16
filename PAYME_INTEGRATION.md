# Payme Integration Documentation

This document describes the Payme payment integration implementation for the Uplift Plan application.

## Overview

The Payme integration allows users to pay for plan upgrades using the Payme payment system. The integration follows the Payme Merchant API specification and includes proper order management.

## Architecture

### Components

1. **Order Schema** (`src/orders/schemas/order.schema.ts`)
   - MongoDB schema for storing payment orders
   - Tracks order status, payment method, amounts, and metadata

2. **Order Service** (`src/orders/order.service.ts`)
   - Service for managing orders in the database
   - Provides methods for creating, updating, and retrieving orders

3. **Payme Service** (`src/payment/payme.service.ts`)
   - Implements Payme Merchant API methods
   - Handles payment creation, validation, and callbacks

4. **Payment Controller** (`src/payment/payment.controller.ts`)
   - Handles Payme webhook callbacks
   - Processes payment completion and updates user plans

5. **User Plan Controller** (`src/user-plan/user-plan.controller.ts`)
   - Updated to handle Payme payments
   - Creates orders and generates payment URLs

## API Endpoints

### User Plan Payment

**POST** `/user-plans/payment`

Creates a new payment order for plan upgrade.

**Request Body:**

```json
{
  "planId": "plan-id-here",
  "paymentMethod": "Payme"
}
```

**Response:**

```json
{
  "message": "Payme payment created successfully",
  "data": {
    "orderId": "order_userId_planId_timestamp",
    "paymentUrl": "https://checkout.paycom.uz/encoded-params",
    "amount": 1000,
    "amountInTiyin": 100000,
    "planName": "Premium Plan",
    "paymentMethod": "Payme",
    "instructions": "Complete the payment in the Payme interface to activate your plan"
  }
}
```

### Payme Webhook

**POST** `/payments/payme/callback`

Handles Payme webhook callbacks for payment processing.

**Headers:**

```
Authorization: Basic base64(merchant_id:signature)
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "callback-id",
  "method": "CheckPerformTransaction|CreateTransaction|PerformTransaction|CancelTransaction|CheckTransaction|GetStatement",
  "params": {
    "id": "transaction-id",
    "account": {
      "orderId": "order-id"
    },
    "amount": 100000,
    "time": 1234567890
  }
}
```

### Order Management

**GET** `/user-plans/orders`

Retrieves all orders for the current user.

**POST** `/user-plans/orders/:orderId`

Retrieves a specific order by ID.

## Payme Merchant API Methods

The integration implements the following Payme Merchant API methods:

### CheckPerformTransaction

- Validates if a transaction can be performed
- Checks order existence and amount validation
- Returns transaction details

### CreateTransaction

- Creates a new transaction in Payme
- Validates order and amount
- Returns transaction ID and creation time

### PerformTransaction

- Confirms payment completion
- Updates order status to PAID
- Activates user plan

### CancelTransaction

- Cancels a transaction
- Updates order status to CANCELLED
- Handles refunds if needed

### CheckTransaction

- Returns transaction status and details
- Used for transaction verification

### GetStatement

- Returns transaction history
- Used for reconciliation

## Order Status Flow

1. **PENDING** - Order created, waiting for payment
2. **CREATED** - Payment URL generated, waiting for user action
3. **PAID** - Payment completed successfully
4. **CANCELLED** - Payment cancelled by user or system
5. **FAILED** - Payment failed due to error
6. **REFUNDED** - Payment refunded

## Configuration

### Environment Variables

```bash
# Payme Configuration
PAYME_MERCHANT_ID=your_merchant_id
PAYME_MERCHANT_KEY=your_merchant_key
PAYME_API_URL=https://checkout.paycom.uz/api
PAYME_CALLBACK_URL=https://your-domain.com/api/payments/payme/callback

# Application Configuration
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=mongodb://localhost:27017/uplift-plan
```

### Payme Sandbox Testing

For testing, use the Payme sandbox:

- **Sandbox URL:** https://test.paycom.uz
- **Test Merchant ID:** Provided by Payme
- **Test Merchant Key:** Provided by Payme

## Testing

### Manual Testing

1. **Create Payment Order:**

   ```bash
   curl -X POST http://localhost:3000/user-plans/payment \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"planId": "plan-id", "paymentMethod": "Payme"}'
   ```

2. **Test Payme Callback:**
   ```bash
   curl -X POST http://localhost:3000/payments/payme/callback \
     -H "Authorization: Basic base64(merchant_id:merchant_key)" \
     -H "Content-Type: application/json" \
     -d '{
       "id": "123",
       "method": "CheckPerformTransaction",
       "params": {
         "account": {"orderId": "test_order_123"},
         "amount": 100000
       }
     }'
   ```

### Automated Testing

Run the test script:

```bash
# Set environment variables
export TEST_USER_TOKEN="your-jwt-token"
export API_URL="http://localhost:3000"

# Run tests
node test-payme-integration.js
```

## Error Handling

### Common Error Codes

- **-31001:** Invalid amount
- **-31050:** Invalid account/order ID
- **-31008:** Unable to perform operation
- **-32504:** Authorization invalid

### Error Response Format

```json
{
  "error": {
    "code": -31001,
    "message": "Invalid amount"
  }
}
```

## Security Considerations

1. **Authorization:** All webhook calls must include proper Basic authentication
2. **Signature Validation:** HMAC-SHA256 signatures are validated for production
3. **Order Validation:** Orders are validated against database records
4. **Amount Validation:** Payment amounts are validated against order amounts

## Monitoring and Logging

The integration includes comprehensive logging:

- Payment creation and processing
- Webhook callback handling
- Error tracking and debugging
- Order status changes

## Production Deployment

1. **Update Environment Variables:**
   - Set production Payme credentials
   - Update callback URLs to production domains
   - Configure proper MongoDB connection

2. **Enable Signature Validation:**
   - Remove sandbox bypasses
   - Enable HMAC-SHA256 signature validation

3. **Monitor Webhook Endpoints:**
   - Ensure webhook URLs are accessible
   - Monitor callback processing logs
   - Set up alerts for failed payments

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Callbacks:**
   - Check webhook URL accessibility
   - Verify authorization headers
   - Check firewall settings

2. **Payment Not Completing:**
   - Verify order exists in database
   - Check amount validation
   - Review callback processing logs

3. **Authorization Errors:**
   - Verify merchant ID and key
   - Check signature generation
   - Ensure proper header format

### Debug Endpoints

- **GET** `/payments/debug-config` - Check Payme configuration
- **POST** `/payments/test/webhook` - Test webhook processing
- **POST** `/payments/test/amount-validation` - Test amount validation

## Support

For Payme-specific issues, refer to:

- [Payme Merchant API Documentation](https://help.payme.uz/)
- [Payme Sandbox](https://test.paycom.uz/)
- [Payme Support](https://payme.uz/support)

For application-specific issues, check the application logs and error messages.
