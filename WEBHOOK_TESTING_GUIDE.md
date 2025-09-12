# Payme Webhook Testing Guide

## Webhook Endpoint Configuration

Your Payme webhook is configured to point to:

```
https://your-domain.com/api/payments/payme/callback
```

## Webhook Testing Methods

### Method 1: Using the Test Endpoint

Test your webhook handling with the new test endpoint:

```bash
# Test CheckPerformTransaction webhook
curl -X POST http://localhost:3000/api/payments/test/webhook \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "CheckPerformTransaction",
    "orderId": "test_order_123",
    "amount": 1000
  }'

# Test PerformTransaction webhook (simulates successful payment)
curl -X POST http://localhost:3000/api/payments/test/webhook \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "PerformTransaction",
    "orderId": "test_order_123",
    "transactionId": "transaction_123",
    "amount": 1000
  }'

# Test CancelTransaction webhook
curl -X POST http://localhost:3000/api/payments/test/webhook \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "CancelTransaction",
    "orderId": "test_order_123",
    "transactionId": "transaction_123",
    "amount": 1000
  }'
```

### Method 2: Direct Webhook Testing

You can also test the webhook endpoint directly:

```bash
# Test CheckPerformTransaction
curl -X POST http://localhost:3000/api/payments/payme/callback \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123456789",
    "method": "CheckPerformTransaction",
    "params": {
      "id": "transaction_123",
      "account": {
        "orderId": "test_order_123"
      },
      "amount": 100000,
      "time": 1234567890
    }
  }'

# Test PerformTransaction (successful payment)
curl -X POST http://localhost:3000/api/payments/payme/callback \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123456789",
    "method": "PerformTransaction",
    "params": {
      "id": "transaction_123",
      "account": {
        "orderId": "test_order_123"
      },
      "amount": 100000,
      "time": 1234567890
    }
  }'
```

## Webhook Methods Explained

### 1. CheckPerformTransaction

- **When**: Called before creating a transaction
- **Purpose**: Validates if the transaction can be performed
- **Your Response**: Should return `{ result: { allow: true } }` if valid
- **Implementation**: Validate order exists and amount matches

### 2. CreateTransaction

- **When**: Called when Payme creates a new transaction
- **Purpose**: Creates transaction record in your system
- **Your Response**: Should return transaction details
- **Implementation**: Create transaction in your database

### 3. PerformTransaction

- **When**: Called after successful payment
- **Purpose**: Confirms the transaction (marks as paid)
- **Your Response**: Should return confirmation
- **Implementation**: Update transaction status to paid, activate user plan

### 4. CancelTransaction

- **When**: Called when payment fails or is cancelled
- **Purpose**: Cancels the transaction
- **Your Response**: Should return cancellation details
- **Implementation**: Update transaction status to cancelled

### 5. CheckTransaction

- **When**: Called to check transaction status
- **Purpose**: Returns current transaction state
- **Your Response**: Should return transaction details
- **Implementation**: Query transaction from database

### 6. GetStatement

- **When**: Called to get transaction history
- **Purpose**: Returns list of transactions
- **Your Response**: Should return transaction array
- **Implementation**: Query transactions from database

## Expected Webhook Flow

### Successful Payment Flow:

1. **CheckPerformTransaction** → Validate order and amount
2. **CreateTransaction** → Create transaction record
3. **PerformTransaction** → Mark as paid, activate user plan

### Failed/Cancelled Payment Flow:

1. **CheckPerformTransaction** → Validate order and amount
2. **CreateTransaction** → Create transaction record
3. **CancelTransaction** → Mark as cancelled

## Webhook Response Format

### Success Response:

```json
{
  "result": {
    "success": true
  }
}
```

### Error Response:

```json
{
  "error": {
    "code": -31000,
    "message": "Error description"
  }
}
```

## Testing Checklist

- [ ] **CheckPerformTransaction** returns success for valid orders
- [ ] **CreateTransaction** creates transaction records
- [ ] **PerformTransaction** activates user plans correctly
- [ ] **CancelTransaction** handles cancellations properly
- [ ] **CheckTransaction** returns correct transaction state
- [ ] **GetStatement** returns transaction history
- [ ] Error handling works for invalid requests
- [ ] Logging captures all webhook calls
- [ ] Database updates work correctly

## Common Issues

### 1. Webhook Not Receiving Calls

- Check if your server is accessible from the internet
- Verify the webhook URL is correct
- Ensure HTTPS is used in production
- Check firewall settings

### 2. Webhook Processing Errors

- Validate request format matches Payme specification
- Check database connections
- Verify user plan logic
- Review error logs

### 3. Transaction State Issues

- Ensure proper state transitions
- Handle duplicate webhook calls
- Implement idempotency
- Validate transaction amounts

## Production Considerations

1. **Security**: Validate webhook signatures (if Payme provides them)
2. **Idempotency**: Handle duplicate webhook calls gracefully
3. **Logging**: Log all webhook calls for debugging
4. **Error Handling**: Return proper error codes
5. **Database**: Use transactions for data consistency
6. **Monitoring**: Set up alerts for webhook failures

## Debugging Tips

1. **Enable Debug Logging**: Check application logs for webhook calls
2. **Test with Real Orders**: Use actual order IDs from your system
3. **Verify Database**: Check if transactions are created/updated correctly
4. **Check User Plans**: Verify user plan activation works
5. **Monitor Errors**: Watch for webhook processing errors

## Example Test Results

```json
{
  "message": "Webhook test for PerformTransaction completed",
  "data": {
    "userId": "user_123",
    "method": "PerformTransaction",
    "callbackData": {
      "id": "123456789",
      "method": "PerformTransaction",
      "params": {
        "id": "transaction_123",
        "account": {
          "orderId": "test_order_123"
        },
        "amount": 100000,
        "time": 1234567890
      }
    },
    "result": {
      "success": true
    },
    "webhookUrl": "http://localhost:3000/api/payments/payme/callback"
  }
}
```

Your webhook endpoint is now properly configured to handle all Payme callback methods. Test each method to ensure your payment flow works correctly!
