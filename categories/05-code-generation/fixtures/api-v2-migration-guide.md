# ACME API v1 to v2 Migration Guide

## Base URL Change
- v1: `https://api.acme.com/v1`
- v2: `https://api.acme.com/v2`

## Authentication Change
- v1: API key via constructor `apiKey` option (sent as `X-API-Key` header).
- v2: API key via constructor `auth` option with type `{ type: 'bearer', token: string }`. Sent as `Authorization: Bearer <token>` header.

## Pagination Changes
v1 used offset-based pagination. v2 uses cursor-based pagination.

- v1 request params: `{ page: number, page_size: number }`
- v2 request params: `{ limit: number, cursor?: string }`
- v1 response: `{ data: T[], page, pageSize, totalPages, totalCount }`
- v2 response: `{ items: T[], nextCursor: string | null, hasMore: boolean, total: number }`

Note: The response array field changed from `data` to `items`.

## Method Renames
| v1 Method | v2 Method | Notes |
|-----------|-----------|-------|
| `client.get()` | `client.fetch()` | GET requests |
| `client.post()` | `client.create()` | POST requests |
| `client.put()` | `client.update()` | PUT requests (now PATCH semantics) |
| `client.delete()` | `client.remove()` | DELETE requests |

## Response Wrapper Change
- v1: `response.data` contains the result directly.
- v2: `response.result` contains the result. `response.meta` contains metadata (request ID, rate limit info).

## Error Response Format Change
- v1 errors: `{ status: number, message: string }`
- v2 errors: `{ errors: Array<{ code: string, message: string, field?: string }>, requestId: string }`

Update error handling to iterate over the `errors` array. Each error has a machine-readable `code` (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED`).

## Type/Schema Changes

### User
- `created` (unix timestamp string) renamed to `createdAt` (ISO 8601 string).
- New field: `updatedAt` (ISO 8601 string).
- `role` (string) changed to `roles` (string array) - users can now have multiple roles.

### Product
- `active` (boolean) changed to `status` (enum: "active" | "inactive" | "archived").
- `price` (number) changed to `pricing: { amount: number, currency: string }`.
- New field: `metadata: Record<string, string>` for custom key-value pairs.

### Order
- `user_id` in request body renamed to `userId`.
- `items[].product_id` renamed to `items[].productId`.
- `items[].qty` renamed to `items[].quantity`.
- `total` removed from create request (server-calculated in v2).
- New field: `cancelledAt` (ISO 8601 string, nullable).

## Rate Limiting
- v1: 429 status with `Retry-After` header (seconds).
- v2: 429 status with `X-RateLimit-Reset` header (ISO 8601 timestamp). Error code is `RATE_LIMITED`. Use the `response.meta.rateLimitRemaining` field to preemptively slow down.

## Deprecated Endpoints
- `GET /users/:id/orders` is removed. Use `GET /orders?userId=:id` instead.
