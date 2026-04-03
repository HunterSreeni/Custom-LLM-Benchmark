# Vulnerability Description - For CVSS Scoring

## Summary
An authenticated user of the SaaS platform can access and modify other tenants' billing records by manipulating the `tenantId` parameter in the billing API endpoint.

## Technical Details

**Endpoint**: `PUT /api/v2/billing/invoices/{invoiceId}`

**Normal behavior**: An authenticated user sends a request to update their own invoice details (payment method, billing address). The request includes a `tenantId` field in the JSON body.

**Vulnerability**: The server-side authorization check only verifies that the user is authenticated and has the "billing_admin" role within their own tenant. It does NOT verify that the `tenantId` in the request body matches the authenticated user's actual tenant. By changing the `tenantId` to another tenant's ID, the user can:

1. **Read** other tenants' invoice details (billing addresses, payment methods - last 4 digits of cards visible).
2. **Modify** other tenants' billing addresses and payment method preferences.
3. **Cannot** view full card numbers or trigger actual charges.

**Prerequisites**:
- Attacker must have a valid account on the platform (free tier is sufficient).
- Attacker must have "billing_admin" role (default for account creator).
- Attacker needs to know or enumerate valid tenant IDs (they are sequential integers starting from 1000).

**Affected data**:
- Billing addresses (name, street, city, state, zip, country)
- Payment method metadata (card type, last 4 digits, expiration month/year)
- Invoice history (amounts, dates, descriptions)
- No access to full card numbers, CVVs, or ability to initiate charges.

**Network**: Exploitable over the internet via standard HTTPS API calls.

**User interaction**: None required beyond the attacker's own actions.

**Scope**: The vulnerable billing service runs as a separate microservice but shares the same user authentication system. Compromising billing data does not grant access to the main application data store.
