# Borderline Finding - Raw Notes

## Target
E-commerce platform API (authorized bug bounty, HackerOne program).

## Finding: Email Enumeration via Password Reset Timing

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**: `{ "email": "test@example.com" }`

**Observed behavior**:
- When the email exists in the database: response time is 340-380ms.
- When the email does NOT exist: response time is 12-18ms.
- The response body is identical in both cases: `{ "message": "If an account exists, a reset email has been sent." }`

**Root cause (likely)**: When the email exists, the server generates a reset token, stores it in the database, and sends an email via SMTP. When it doesn't exist, it returns immediately. The generic response message is correct, but the timing difference leaks the information.

**What an attacker could do**:
1. Enumerate which email addresses have accounts on the platform.
2. Use this for targeted phishing (know who to target).
3. Credential stuffing optimization (only try passwords for emails that exist).
4. Competitive intelligence (check if competitor employees have accounts).

**Measured accuracy**: Tested with 100 known-existing and 100 known-nonexisting emails. Detection accuracy was 98% using a 100ms threshold.

**Limitations**:
- Requires sending many requests (detectable by rate limiting, but current rate limit is 60 requests/minute - generous enough for enumeration).
- Network jitter could reduce accuracy for single requests, but statistical analysis over 3-5 requests per email gives reliable results.
- The platform already has a public registration page that shows "email already in use" - so email enumeration is partially possible via that endpoint too.

**Why triage might reject this**:
- "Informational only" - email enumeration is often deprioritized.
- The registration endpoint already leaks this (counter: registration may be locked down independently, timing attack persists).
- "Expected behavior" - developers consciously chose the generic message.
- Low direct impact without chaining to another vulnerability.

## My Assessment
This sits in the gray area. The timing difference is clear and measurable. But the direct impact is limited to information disclosure. The existing registration page enumeration weakens the argument. However, the registration page could be fixed independently while this timing issue remains unaddressed.
