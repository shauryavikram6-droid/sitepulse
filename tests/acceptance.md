# Acceptance cURL Tests

These examples assume the stack is running locally at `http://localhost:3000` with the seeded demo data.

## 1. Login and capture cookies
```
curl -i -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"engineer@demo.com","password":"sitepulse123"}'
```

## 2. Fetch assigned sites (captures the siteId for later requests)
```
curl -b cookies.txt http://localhost:3000/api/v1/me/sites
```

## 3. Create attendance with idempotency
```
SITE_ID="<replace-with-site-id>"
TRADE_ID="<replace-with-trade-id>"
curl -b cookies.txt -X POST http://localhost:3000/api/v1/sites/$SITE_ID/attendance \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-123" \
  -d '{"entries":[{"date":"2024-01-10","tradeId":"'$TRADE_ID'","headcount":5}]}'
```

## 4. Trigger DPR prompt (WhatsApp mocked when token missing)
```
curl -b cookies.txt -X POST http://localhost:3000/api/v1/sites/$SITE_ID/dpr/send \
  -H "Content-Type: application/json" \
  -d '{"to":"919876543210"}'
```

## 5. Download latest drawing diff summary
```
DRAWING_ID="<replace-with-drawing-id>"
curl -b cookies.txt http://localhost:3000/api/v1/drawings/$DRAWING_ID/diff/latest
```

Run `npm run acceptance` to execute an automated version of these checks.
