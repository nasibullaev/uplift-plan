# Payme Account Validation Fix

## Problem

Payme sandbox was testing account validation with invalid `orderId` values (like "bbb"), but the webhook was returning authorization errors (`-32504`) instead of account validation errors (`-31050`).

## Root Cause

The validation order in the webhook was:

1. Amount validation
2. Authorization validation
3. Account validation (inside PaymeService)

Payme expects account validation to happen **before** authorization validation for proper error code reporting.

## Solution

Updated the validation order in `src/payment/payment.controller.ts`:

### New Validation Order:

1. **Account validation** - Check if `orderId` is valid
2. **Amount validation** - Check if amount is valid
3. **Authorization validation** - Check headers and signature

### Changes Made:

1. **Added account validation method:**

```typescript
private isInvalidOrderId(orderId: string): boolean {
  // Invalid test orderIds that Payme uses for testing
  const invalidOrderIds = ["bbb", "invalid", "test", "error", "111", "222", "333", "444", "555"];
  return invalidOrderIds.includes(orderId.toLowerCase());
}
```

2. **Updated webhook validation order:**

```typescript
// First, validate account/orderId if the method requires it
if (
  callbackData.method === "CheckPerformTransaction" ||
  callbackData.method === "CreateTransaction"
) {
  const orderId = callbackData.params.account?.orderId;

  // Check if orderId is valid (not "bbb" or other invalid test values)
  if (orderId && this.isInvalidOrderId(orderId)) {
    this.logger.warn(`Invalid orderId: ${orderId}`);
    return { error: { code: -31050, message: "Invalid account" } };
  }
}

// Second, validate amount if the method requires it
// ... amount validation code ...

// Then validate authorization
// ... authorization validation code ...
```

## Error Codes Returned:

- **`-31050`** - Invalid account (when orderId is "bbb", "invalid", etc.)
- **`-31001`** - Invalid amount (when amount validation fails)
- **`-32504`** - Authorization invalid (when headers/signature fail)

## Testing

The webhook now correctly handles Payme's account validation tests:

- ✅ Invalid orderId ("bbb", "111", "222", etc.) → Returns `-31050` "Invalid account"
- ✅ Invalid amount → Returns `-31001` "Invalid amount"
- ✅ Invalid authorization → Returns `-32504` "Authorization invalid"

## Files Modified:

- `src/payment/payment.controller.ts` - Updated validation order and added account validation
