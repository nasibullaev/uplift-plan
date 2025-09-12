# Payme Authorization Fix - Complete Guide

## 🔧 **Problem Solved**

Your Payme webhook was failing authorization validation tests because it wasn't properly validating the `Authorization` header. Payme expects all webhook calls to include proper authorization with error code `-32504` when validation fails.

## ✅ **What Was Fixed**

### **1. Authorization Header Validation**

- ✅ Added proper `Authorization` header validation
- ✅ Validates `Basic` authentication format
- ✅ Decodes base64 credentials
- ✅ Validates merchant ID matches configuration
- ✅ Validates HMAC-SHA256 signature
- ✅ Returns proper error code `-32504` for authorization failures

### **2. Added ChangePassword Method Support**

- ✅ Added `ChangePassword` method handler
- ✅ Updated interfaces to support password parameter
- ✅ Returns success for password change requests

### **3. Enhanced Error Handling**

- ✅ Proper error codes for different failure scenarios
- ✅ Comprehensive logging for debugging
- ✅ Graceful error responses

## 🔍 **Authorization Flow**

### **Expected Authorization Header Format:**

```
Authorization: Basic base64(merchant_id:signature)
```

### **Validation Steps:**

1. **Check Header Exists** - Return `-32504` if missing
2. **Validate Format** - Must be `Basic base64(...)`
3. **Decode Credentials** - Extract merchant_id and signature
4. **Validate Merchant ID** - Must match configured merchant ID
5. **Validate Signature** - Must match HMAC-SHA256 of request body

## 📋 **Supported Methods**

Your webhook now properly handles all Payme methods:

1. **CheckPerformTransaction** ✅
2. **CreateTransaction** ✅
3. **PerformTransaction** ✅
4. **CancelTransaction** ✅
5. **CheckTransaction** ✅
6. **GetStatement** ✅
7. **ChangePassword** ✅

## 🧪 **Testing Your Fix**

### **Test 1: Valid Authorization**

```bash
# This should work (with valid credentials)
curl -X POST http://localhost:3000/api/payments/payme/callback \
  -H "Authorization: Basic $(echo -n 'your_merchant_id:your_signature' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123456789",
    "method": "CheckPerformTransaction",
    "params": {
      "amount": 50000,
      "account": {
        "orderId": "test_order_123"
      }
    }
  }'
```

### **Test 2: Missing Authorization**

```bash
# This should return -32504 error
curl -X POST http://localhost:3000/api/payments/payme/callback \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123456789",
    "method": "CheckPerformTransaction",
    "params": {
      "amount": 50000,
      "account": {
        "orderId": "test_order_123"
      }
    }
  }'
```

### **Test 3: Invalid Authorization**

```bash
# This should return -32504 error
curl -X POST http://localhost:3000/api/payments/payme/callback \
  -H "Authorization: Basic invalid_credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123456789",
    "method": "CheckPerformTransaction",
    "params": {
      "amount": 50000,
      "account": {
        "orderId": "test_order_123"
      }
    }
  }'
```

## 📊 **Expected Test Results**

### **Before Fix (Failing Tests):**

```json
{
  "result": {
    "success": true
  }
}
```

❌ **Wrong**: Should return `-32504` error for invalid authorization

### **After Fix (Passing Tests):**

```json
{
  "error": {
    "code": -32504,
    "message": "Authorization invalid"
  }
}
```

✅ **Correct**: Returns proper error code for authorization failures

## 🔐 **Security Features**

1. **Merchant ID Validation** - Ensures only your merchant ID is accepted
2. **Signature Validation** - Validates HMAC-SHA256 signature of request
3. **Header Format Validation** - Ensures proper Basic auth format
4. **Comprehensive Logging** - Logs all authorization attempts for security monitoring

## 🚀 **Next Steps**

1. **Deploy the Fix** - Deploy your updated webhook endpoint
2. **Test with Payme** - Run Payme's webhook tests again
3. **Monitor Logs** - Check logs for any authorization issues
4. **Verify All Methods** - Ensure all 7 methods work correctly

## 📝 **Environment Variables Required**

Make sure these are set in your environment:

```env
PAYME_MERCHANT_ID=your_merchant_id
PAYME_MERCHANT_KEY=your_merchant_key
```

## 🎯 **Success Criteria**

Your webhook should now pass all Payme tests:

- ✅ Returns `-32504` for missing Authorization header
- ✅ Returns `-32504` for invalid Authorization header
- ✅ Returns `-32504` for wrong merchant ID
- ✅ Returns `-32504` for invalid signature
- ✅ Returns success for valid authorization
- ✅ Handles all 7 Payme methods correctly

The authorization validation is now properly implemented according to Payme's specifications!
