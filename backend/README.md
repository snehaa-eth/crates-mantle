# USE CRATES Backend API

This backend powers the USE CRATES app, allowing users to subscribe to investment crates, view stocks, and manage investments.

---

## Authentication
Some routes require the `x-user-address` header for authentication:

```
-H "x-user-address: <wallet_address>"
```

---

## Crate (Basket) APIs

### Create Crate
```
curl -X POST http://localhost:4000/api/v1/crates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Leaders",
    "description": "Top tech stocks",
    "imageUrl": "https://example.com/image.png",
    "createdBy": "user_wallet_address",
    "subscriptionAmount": 100,
    "subscriptionPeriod": "monthly",
    "rebalanceFrequency": "monthly",
    "riskPercent": 20,
    "totalReturnPercent": 15,
    "monthlyReturnPercent": 2,
    "stocks": [
      { "stock": "<XStock_ID_1>", "weight": 60, "price": 150 },
      { "stock": "<XStock_ID_2>", "weight": 40, "price": 200 }
    ]
  }'
```

### Get All Crates
```
curl http://localhost:4000/api/v1/crates
```

### Get Crate by ID
```
curl http://localhost:4000/api/v1/crates/<crate_id>
```

### Update Crate
```
curl -X PUT http://localhost:4000/api/v1/crates/<crate_id> \
  -H "Content-Type: application/json" \
  -d '{ "description": "Updated description" }'
```

### Get All Stocks in a Crate
```
curl http://localhost:4000/api/v1/crates/<crate_id>/stocks
```

---

## User APIs

### Register User
```
curl -X POST http://localhost:4000/api/v1/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "user_wallet_address",
    "email": "user@example.com",
    "name": "Alice",
    "phoneNumber": "1234567890",
    "kyc": { "pan": "ABCDE1234F" }
  }'
```

### Get User by Wallet
```
curl http://localhost:4000/api/v1/user/<wallet>
```

### Subscribe to Crate (Access Only)
```
curl -X POST http://localhost:4000/api/v1/user/<wallet>/subscribe \
  -H "Content-Type: application/json" \
  -d '{ "crateId": "<crate_id>" }'
```

### Reinvest/Invest in Crate
```
curl -X POST http://localhost:4000/api/v1/user/<wallet>/reinvest \
  -H "Content-Type: application/json" \
  -d '{ "crateId": "<crate_id>", "amountUSD": 500, "txHash": "0xabc123" }'
```

### Get User Portfolio Stats
```
curl http://localhost:4000/api/v1/user/<wallet>/portfolio/stats
```

### Get All Stocks in User’s Portfolio
```
curl http://localhost:4000/api/v1/user/<wallet>/portfolio/stocks
```

---

## Transaction APIs

### Create Transaction (buy/sell/invest/etc.)
```
curl -X POST http://localhost:4000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user_id>",
    "crateId": "<crate_id>",
    "type": "buy",  # or "sell", "subscribe", "reinvest"
    "amountUSD": 100,
    "transactionHash": "0xabc123",
    "stockId": "<XStock_ID>",   # only for buy/sell
    "shares": 10,                # only for buy/sell
    "pricePerShare": 15          # only for buy/sell
  }'
```

### Get Transactions by User
```
curl http://localhost:4000/api/v1/transactions/user/<user_id>
```

### Get Transactions by Crate
```
curl http://localhost:4000/api/v1/transactions/crate/<crate_id>
```

### Get Transaction by ID
```
curl http://localhost:4000/api/v1/transactions/<transaction_id>
```

---

## Notes
- Replace `<...>` with your actual IDs or values.
- For protected routes, add the header:
  ```
  -H "x-user-address: <wallet_address>"
  ```
- All endpoints return JSON responses.
