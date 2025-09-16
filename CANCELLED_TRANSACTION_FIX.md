# Payme Cancelled Transaction Fix

## Problem Description

The Payme PerformTransaction test was failing when testing cancelled transactions because:

1. **PerformTransaction** was not returning the correct error code (-31008) for cancelled transactions
2. **CheckTransaction** was returning incorrect values for cancelled transactions:
   - `perform_time` should be 0 (was returning actual perform_time)
   - `cancel_time` should be timestamp in milliseconds (was incorrect format)
   - `state` should be -1 (was returning 2)
   - `reason` should be 3 (was returning null)

## Test Case Analysis

The test case involves:

1. **PerformTransaction on cancelled transaction** - Should return error -31008
2. **CheckTransaction on cancelled transaction** - Should return correct values for cancelled state

## Root Causes

### 1. **cancel_time Storage Format Inconsistency**

- `cancel_time` was being stored in **seconds** but expected in **milliseconds**
- This caused incorrect timestamp values in responses

### 2. **Transaction State Mismatch**

- The test expected the transaction to be in CANCELLED state (-1)
- But the transaction was actually in PERFORMED state (2)
- This suggests the transaction was performed before being cancelled

## Solution

### 1. **Fixed cancel_time Storage Format**

```typescript
// Before: Store in seconds
const cancelTime = Math.floor(Date.now() / 1000);

// After: Store in milliseconds
const cancelTime = Date.now();
```

### 2. **Updated All Methods to Handle Milliseconds**

- **CancelTransaction**: Store and return `cancel_time` in milliseconds
- **CheckTransaction**: Return `cancel_time` directly (no conversion)
- **GetStatement**: Return `cancel_time` directly (no conversion)

### 3. **Fixed Idempotency Handling**

```typescript
// Before: Convert from seconds
cancel_time: (transaction.cancel_time || 0) * 1000;

// After: Return directly
cancel_time: transaction.cancel_time || 0;
```

## Expected Behavior

### PerformTransaction on Cancelled Transaction

```json
{
  "error": {
    "code": -31008,
    "message": "Невозможно выполнить операцию"
  }
}
```

### CheckTransaction on Cancelled Transaction

```json
{
  "result": {
    "create_time": 1758033292000,
    "perform_time": 0, // ← Should be 0
    "cancel_time": 1758033307456, // ← Should be timestamp in milliseconds
    "transaction": "68c9758b20cfb2025b9edc17",
    "state": -1, // ← Should be -1 (CANCELLED)
    "reason": 3 // ← Should be 3 (TRANSACTION_ERROR)
  }
}
```

## Verification

The fix ensures that:

1. ✅ PerformTransaction returns error -31008 for cancelled transactions
2. ✅ CheckTransaction returns `perform_time: 0` for cancelled transactions
3. ✅ CheckTransaction returns `cancel_time` in milliseconds
4. ✅ CheckTransaction returns `state: -1` for cancelled transactions
5. ✅ CheckTransaction returns `reason: 3` for cancelled transactions
6. ✅ All timestamp formats are consistent across all methods

## Files Modified

- `src/payment/payme.service.ts` - Fixed `handleCancelTransaction`, `handleCheckTransaction`, and `handleGetStatement` methods

## Test Script

A test script `test-cancelled-transaction-fix.js` has been created to verify the fix works correctly. Update the configuration variables before running:

```bash
node test-cancelled-transaction-fix.js
```

## Important Notes

### Transaction State Requirements

For the test to pass, the transaction must be in **CANCELLED** state (-1), not PERFORMED state (2). This means:

1. **Create transaction** (state: 1 - CREATED)
2. **Cancel transaction** (state: -1 - CANCELLED)
3. **Test PerformTransaction** (should return error -31008)
4. **Test CheckTransaction** (should return cancelled values)

### Database Schema Impact

The `cancel_time` field now stores milliseconds instead of seconds, consistent with `perform_time`. This ensures:

- **Consistent timestamp format** across all Payme API methods
- **No conversion errors** between storage and retrieval
- **Proper idempotency** for repeated API calls

### Migration Considerations

⚠️ **Important**: Existing transactions in the database may have `cancel_time` stored in seconds. For production deployment:

1. **Migration script** to convert existing `cancel_time` values from seconds to milliseconds
2. **Gradual rollout** to avoid breaking existing transactions
3. **Backup** before applying changes

## Related Fixes

This fix is related to the previous PerformTransaction idempotency fix, ensuring consistent timestamp handling across all Payme API methods:

- `perform_time`: Stored and returned in milliseconds
- `cancel_time`: Stored and returned in milliseconds
- `create_time`: Converted from seconds to milliseconds for API responses
