#!/bin/bash

# Test script for PerformTransaction idempotency using test_order_17
# This script tests the Payme callback endpoint directly

BASE_URL="http://localhost:4000"
ORDER_ID="test_order_17"
AMOUNT=5000000
TRANSACTION_ID="68c969e320cfb2025b9edbed"

echo "🚀 Starting PerformTransaction Idempotency Test..."
echo "This test verifies that repeated calls to PerformTransaction"
echo "return the same perform_time value for consistency."
echo ""

# Function to make Payme callback request
make_payme_request() {
    local method=$1
    local params=$2
    local request_id=$(date +%s)
    
    local payload=$(cat <<EOF
{
    "id": "$request_id",
    "method": "$method",
    "params": $params
}
EOF
)
    
    echo "📤 Sending $method request:"
    echo "$payload" | jq .
    echo ""
    
    local response=$(curl -s -X POST "$BASE_URL/payments/payme/callback" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    echo "📥 Received $method response:"
    echo "$response" | jq .
    echo ""
    
    echo "$response"
}

echo "Step 1: CheckPerformTransaction"
check_response=$(make_payme_request "CheckPerformTransaction" "{
    \"account\": {
        \"orderId\": \"$ORDER_ID\"
    },
    \"amount\": $AMOUNT,
    \"time\": $(date +%s)
}")

# Check if CheckPerformTransaction was successful
if echo "$check_response" | jq -e '.result.allow' > /dev/null; then
    echo "✅ CheckPerformTransaction successful"
    echo ""
    
    echo "Step 2: CreateTransaction"
    create_response=$(make_payme_request "CreateTransaction" "{
        \"id\": \"$TRANSACTION_ID\",
        \"account\": {
            \"orderId\": \"$ORDER_ID\"
        },
        \"amount\": $AMOUNT,
        \"time\": $(date +%s)
    }")
    
    # Check if CreateTransaction was successful
    if echo "$create_response" | jq -e '.result.transaction' > /dev/null; then
        echo "✅ CreateTransaction successful"
        echo ""
        
        echo "Step 3: First PerformTransaction call"
        first_perform_response=$(make_payme_request "PerformTransaction" "{
            \"id\": \"$TRANSACTION_ID\"
        }")
        
        # Extract perform_time from first call
        first_perform_time=$(echo "$first_perform_response" | jq -r '.result.perform_time // empty')
        
        if [ -n "$first_perform_time" ]; then
            echo "✅ First PerformTransaction successful - perform_time: $first_perform_time"
            echo ""
            
            echo "Step 4: Second PerformTransaction call (idempotency test)"
            second_perform_response=$(make_payme_request "PerformTransaction" "{
                \"id\": \"$TRANSACTION_ID\"
            }")
            
            # Extract perform_time from second call
            second_perform_time=$(echo "$second_perform_response" | jq -r '.result.perform_time // empty')
            
            if [ -n "$second_perform_time" ]; then
                echo "✅ Second PerformTransaction successful - perform_time: $second_perform_time"
                echo ""
                
                echo "Step 5: Verifying idempotency..."
                if [ "$first_perform_time" = "$second_perform_time" ]; then
                    echo "🎉 SUCCESS: perform_time values are identical!"
                    echo "   First call:  $first_perform_time"
                    echo "   Second call: $second_perform_time"
                    echo "   ✅ Idempotency test PASSED"
                    echo ""
                    
                    echo "Step 6: CheckTransaction to verify consistency"
                    check_transaction_response=$(make_payme_request "CheckTransaction" "{
                        \"id\": \"$TRANSACTION_ID\"
                    }")
                    
                    check_transaction_perform_time=$(echo "$check_transaction_response" | jq -r '.result.perform_time // empty')
                    
                    if [ -n "$check_transaction_perform_time" ]; then
                        echo "✅ CheckTransaction successful - perform_time: $check_transaction_perform_time"
                        
                        if [ "$check_transaction_perform_time" = "$first_perform_time" ]; then
                            echo "🎉 SUCCESS: CheckTransaction perform_time matches PerformTransaction!"
                            echo "   ✅ Consistency test PASSED"
                            echo ""
                            echo "🎉 All tests passed! PerformTransaction idempotency is working correctly."
                        else
                            echo "❌ FAILURE: CheckTransaction perform_time differs from PerformTransaction!"
                            echo "   PerformTransaction: $first_perform_time"
                            echo "   CheckTransaction:   $check_transaction_perform_time"
                            echo "   ❌ Consistency test FAILED"
                            exit 1
                        fi
                    else
                        echo "❌ FAILURE: CheckTransaction failed"
                        exit 1
                    fi
                else
                    echo "❌ FAILURE: perform_time values are different!"
                    echo "   First call:  $first_perform_time"
                    echo "   Second call: $second_perform_time"
                    echo "   ❌ Idempotency test FAILED"
                    exit 1
                fi
            else
                echo "❌ FAILURE: Second PerformTransaction failed"
                exit 1
            fi
        else
            echo "❌ FAILURE: First PerformTransaction failed"
            exit 1
        fi
    else
        echo "❌ FAILURE: CreateTransaction failed"
        exit 1
    fi
else
    echo "❌ FAILURE: CheckPerformTransaction failed"
    exit 1
fi

