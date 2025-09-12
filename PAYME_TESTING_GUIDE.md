# Payme Integration Testing Guide

This guide will help you test the Payme integration with your NestJS application.

## Prerequisites

1. **Payme Merchant Account**: You need a valid Payme merchant account
2. **Merchant Credentials**: Your merchant ID and merchant key
3. **Environment Setup**: Proper environment variables configured

## Environment Configuration

Create or update your `.env` file with the following variables:

```env
# Payme Configuration
PAYME_MERCHANT_ID=your_merchant_id_here
PAYME_MERCHANT_KEY=your_merchant_key_here
PAYME_API_URL=https://checkout.paycom.uz/api
PAYME_CALLBACK_URL=http://your-domain.com/api/payments/payme/callback

# Application Configuration
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/uplift-plan

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
```

## Testing Methods

### Method 1: Using the Test Script

1. **Install dependencies** (if not already installed):

   ```bash
   npm install axios crypto-js
   ```

2. **Set environment variables**:

   ```bash
   export PAYME_MERCHANT_ID=your_merchant_id
   export PAYME_MERCHANT_KEY=your_merchant_key
   export PAYME_API_URL=https://checkout.paycom.uz/api
   ```

3. **Run the test script**:
   ```bash
   node test-payme-integration.js
   ```

### Method 2: Using the API Endpoints

Start your NestJS application and use the following test endpoints:

#### 1. Test Configuration

```bash
curl -X POST http://localhost:3000/api/payments/test/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### 2. Test Connection

```bash
curl -X POST http://localhost:3000/api/payments/test/connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### 3. Test CheckPerformTransaction

```bash
curl -X POST http://localhost:3000/api/payments/test/check-perform \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order_123",
    "amount": 1000
  }'
```

#### 4. Test CreateTransaction

```bash
curl -X POST http://localhost:3000/api/payments/test/create-transaction \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order_123",
    "amount": 1000
  }'
```

#### 5. Test Full Flow

```bash
curl -X POST http://localhost:3000/api/payments/test/full-flow \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order_123",
    "amount": 1000
  }'
```

## Payme API Methods Explained

### 1. CheckPerformTransaction

- **Purpose**: Validates if a transaction can be performed
- **When**: Called before creating a transaction
- **Response**: `{ result: { allow: true } }` if valid

### 2. CreateTransaction

- **Purpose**: Creates a new transaction
- **When**: Called when user initiates payment
- **Response**: Transaction details with ID

### 3. CheckTransaction

- **Purpose**: Gets transaction status
- **When**: Called to check transaction state
- **Response**: Transaction details and current state

### 4. PerformTransaction

- **Purpose**: Confirms the transaction (marks as paid)
- **When**: Called after successful payment
- **Response**: Confirmation with perform time

### 5. CancelTransaction

- **Purpose**: Cancels a transaction
- **When**: Called when payment fails or is cancelled
- **Response**: Cancellation details

### 6. GetStatement

- **Purpose**: Gets transaction history
- **When**: Called to retrieve transaction list
- **Response**: Array of transactions

## Transaction States

- **1**: Pending (waiting for payment)
- **2**: Paid (payment completed)
- **-1**: Pending Canceled (cancelled before payment)
- **-2**: Paid Canceled (cancelled after payment)

## Common Error Codes

- **-31001**: Invalid amount
- **-31003**: Transaction not found
- **-31008**: Can't do operation
- **-31050**: User/Product not found
- **-31060**: Already paid
- **-32504**: Invalid authorization

## Testing Scenarios

### Scenario 1: Successful Payment Flow

1. Test CheckPerformTransaction
2. Test CreateTransaction
3. Test CheckTransaction (should show state 1)
4. Test PerformTransaction (simulates payment completion)
5. Test CheckTransaction (should show state 2)

### Scenario 2: Cancelled Payment Flow

1. Test CheckPerformTransaction
2. Test CreateTransaction
3. Test CheckTransaction (should show state 1)
4. Test CancelTransaction (simulates payment cancellation)
5. Test CheckTransaction (should show state -1)

### Scenario 3: Invalid Amount

1. Test CheckPerformTransaction with invalid amount
2. Should return error -31001

## Debugging Tips

1. **Check Logs**: Enable debug logging to see detailed request/response data
2. **Verify Credentials**: Ensure merchant ID and key are correct
3. **Test Environment**: Use sandbox environment for testing
4. **Network Issues**: Check if API endpoint is accessible
5. **Signature Validation**: Verify HMAC-SHA256 signature generation

## Production Considerations

1. **Use HTTPS**: Always use HTTPS in production
2. **Validate Callbacks**: Implement proper callback validation
3. **Error Handling**: Implement comprehensive error handling
4. **Logging**: Log all payment-related activities
5. **Security**: Never expose merchant credentials
6. **Rate Limiting**: Implement rate limiting for API endpoints

## Support

If you encounter issues:

1. Check Payme documentation: https://developer.help.paycom.uz/
2. Verify your merchant account status
3. Test with sandbox environment first
4. Contact Payme support if needed

## Example Test Results

```
🚀 Starting Payme Integration Tests...

Configuration:
- Base URL: https://checkout.paycom.uz/api
- Merchant ID: SET
- Merchant Key: SET
- Test Order ID: test_order_1234567890
- Test Amount: 100000 tiyin (1000 UZS)

🔍 Testing CheckPerformTransaction:
✅ Response: { "result": { "allow": true } }

🔍 Testing CreateTransaction:
✅ Response: { "result": { "transaction": "12345", "state": 1, "create_time": 1234567890 } }

📊 Test Summary:
================
✅ Successful: 6
❌ Failed: 0
⏱️  Total time: 1250ms
📈 Average response time: 208ms

✅ CheckPerformTransaction (200ms)
✅ CreateTransaction (180ms)
✅ CheckTransaction (150ms)
✅ PerformTransaction (200ms)
✅ CancelTransaction (220ms)
✅ GetStatement (300ms)

🎯 Recommendations:
- All tests passed! Your Payme integration is working correctly
- You can now implement the payment flow in your application
```
