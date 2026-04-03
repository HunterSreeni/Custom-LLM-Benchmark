# Raw XSS Finding Notes

## Target
- Application: Acme Corp Customer Portal (portal.acme-corp.com)
- Program: Acme Corp Bug Bounty (HackerOne)
- Scope: *.acme-corp.com

## Discovery
Found a reflected XSS on the search functionality.

**Endpoint**: `GET /search?q=<user_input>`

**Vulnerable parameter**: `q` (query string)

**Behavior observed**:
- The search page reflects the query parameter directly into the page HTML without encoding.
- Specifically, the value is inserted into: `<h2>Search results for: {q}</h2>`
- No Content-Security-Policy header present on this page.
- The page uses jQuery 3.4.1 and sets `document.domain = 'acme-corp.com'`.

**Working payload**:
```
https://portal.acme-corp.com/search?q=<img src=x onerror=alert(document.cookie)>
```

**What I confirmed**:
- Payload executes in Chrome 120, Firefox 121, Safari 17.
- `HttpOnly` flag is NOT set on the session cookie `ACME_SID`.
- The session cookie is accessible via `document.cookie`.
- Same-origin with the main portal that contains user PII (name, email, phone, address).
- Authenticated users who click the link will have their session stolen.

**What I did NOT test**:
- Whether the XSS persists anywhere (stored vs reflected).
- Whether WAF would block in production (I tested on staging which has no WAF).
- Other injection points on the same page.

## Authentication Required?
No - the search page is public. But authenticated users' sessions are at risk if they click a crafted link while logged in.

## Screenshots
- screenshot_1.png: Alert box firing with cookie value
- screenshot_2.png: Page source showing unencoded payload in HTML
