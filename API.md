# API (App Router)
**Updated:** 2025-09-29 17:12 UTC

## Payments

### `GET /api/payments/verify?ref=REF`
Auth: student must be logged in.
Calls Paystack Verify using `PAYSTACK_SECRET_KEY` and, on success:
- sets `transactions.status = "success"` and stores the payload in `raw`,
- sets `sessions.payment_status = "paid"`,
- sets `student_requests.status = "paid"`.

Response:
```json
{ "paid": true, "sessionId": "uuid", "requestId": "uuid" }
```
Else:
```json
{ "paid": false }
```

## Chat (next)
Server actions to add:
- `sendMessageAction(formData)` → insert into `messages`.
- `markSeenAction(sessionId)` → update last-seen timestamp in `sessions`.
