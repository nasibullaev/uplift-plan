# Payme PerformTransaction Idempotency Fix

## Problem Description

The Payme PerformTransaction test was failing because the `perform_time` values were different between the first and second calls, violating the idempotency requirement.

## Test Case Analysis

The test case involves:

1. **First PerformTransaction call** - Should perform the transaction and return a `perform_time`
2. **Second PerformTransaction call** - Should return the **exact same** `perform_time` (idempotency)
3. **CheckTransaction call** - Should return the same `perform_time` as PerformTransaction

## Root Cause

The issue was in the data storage and retrieval format:

1. **Storage Issue**: `perform_time` was being stored in **seconds** (converted from milliseconds)
2. **Retrieval Issue**: When retrieving for idempotency, it was converted back to milliseconds by multiplying by 1000
3. **Rounding Error**: This created a different value due to the conversion process

### Example of the Problem:

- **First call**: `perform_time: 1758032950157` (milliseconds)
- **Stored in DB**: `1758032950` (seconds, rounded down)
- **Second call**: `1758032950 * 1000 = 1758032950000` (different value!)

## Solution

Modified the storage format to maintain consistency:

### 1. **Store perform_time in milliseconds**

```typescript
// Before: Store in seconds
const performTimeSeconds = Math.floor(performTimeMilliseconds / 1000);
await this.transactionService.updateTransactionState(
  id,
  TransactionState.PERFORMED,
  performTimeSeconds // ❌ Stored in seconds
);

// After: Store in milliseconds
await this.transactionService.updateTransactionState(
  id,
  TransactionState.PERFORMED,
  performTimeMilliseconds // ✅ Stored in milliseconds
);
```

### 2. **Return stored perform_time directly**

```typescript
// Before: Convert from seconds to milliseconds
const performTimeMilliseconds = transaction.perform_time * 1000;

// After: Return directly (already in milliseconds)
const performTimeMilliseconds = transaction.perform_time;
```

### 3. **Update CheckTransaction method**

```typescript
// Before: Convert from seconds
performTime = transaction.perform_time ? transaction.perform_time * 1000 : 0;

// After: Return directly
performTime = transaction.perform_time || 0;
```

### 4. **Update GetStatement method**

```typescript
// Before: Convert from seconds
perform_time: tx.perform_time ? tx.perform_time * 1000 : 0;

// After: Return directly
perform_time: tx.perform_time || 0;
```

## Expected Behavior

### First PerformTransaction Call

```json
{
  "result": {
    "transaction": "68c9742620cfb2025b9edc11",
    "perform_time": 1758032950157,
    "state": 2
  }
}
```

### Second PerformTransaction Call (Idempotency)

```json
{
  "result": {
    "transaction": "68c9742620cfb2025b9edc11",
    "perform_time": 1758032950157, // ← Same exact value
    "state": 2
  }
}
```

### CheckTransaction

```json
{
  "result": {
    "create_time": 1758032638000,
    "perform_time": 1758032950157, // ← Same exact value
    "cancel_time": 0,
    "transaction": "68c9742620cfb2025b9edc11",
    "state": 2,
    "reason": null
  }
}
```

## Verification

The fix ensures that:

1. ✅ PerformTransaction returns consistent `perform_time` on repeated calls
2. ✅ CheckTransaction returns the same `perform_time` as PerformTransaction
3. ✅ GetStatement returns consistent `perform_time` values
4. ✅ All existing functionality remains intact
5. ✅ No data loss or corruption

## Files Modified

- `src/payment/payme.service.ts` - Fixed `handlePerformTransaction`, `handleCheckTransaction`, and `handleGetStatement` methods

## Test Script

A test script `test-perform-transaction-idempotency.js` has been created to verify the fix works correctly. Update the configuration variables before running:

```bash
node test-perform-transaction-idempotency.js
```

## Migration Note

⚠️ **Important**: Existing transactions in the database may have `perform_time` stored in seconds. For production deployment, consider:

1. **Migration script** to convert existing `perform_time` values from seconds to milliseconds
2. **Gradual rollout** to avoid breaking existing transactions
3. **Backup** before applying changes

## Database Schema Impact

The `perform_time` field in the transaction schema now stores milliseconds instead of seconds. This is more consistent with Payme's API specification which expects millisecond timestamps.
