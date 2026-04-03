# Vulnerability Details - Multi-Platform Report

## Discovery Context
During authorized testing of a web application that offers both a SaaS version and an on-premise version, the following vulnerability was discovered. The vulnerability exists in a shared component used across all deployment types.

## Vulnerability
**Type**: Server-Side Request Forgery (SSRF) via PDF Export Feature

**Affected Component**: The "Export to PDF" feature available in the reporting module. This feature accepts a URL to a custom CSS stylesheet that is fetched server-side to style the PDF output.

**Endpoint**: `POST /api/reports/{reportId}/export`

**Request Body**:
```json
{
  "format": "pdf",
  "customStylesheetUrl": "https://attacker.com/malicious.css"
}
```

**What happens**: The server fetches the URL provided in `customStylesheetUrl` using an HTTP client with no SSRF protections. The response body is included in the PDF generation pipeline.

## Confirmed Impact

1. **Internal network scanning**: By providing internal IPs (e.g., `http://169.254.169.254/latest/meta-data/`), the attacker can probe the internal network and read AWS metadata.
2. **Cloud credential theft**: Successfully retrieved AWS IAM temporary credentials from the metadata endpoint on the SaaS version (running on AWS EC2).
3. **Internal service discovery**: Enumerated internal services running on ports 5432 (PostgreSQL), 6379 (Redis), 8500 (Consul) by observing response timing differences.
4. **Cannot** achieve RCE directly through this SSRF.

## Environment Details
- **SaaS version**: Runs on AWS EC2 with IMDSv1 (no hop limit, no token required).
- **On-premise version**: Impact limited to internal network scanning (no cloud metadata).
- **Affected versions**: 4.2.0 through 4.8.3 (current).
- **Authentication**: Requires authenticated user with "reporting" permission (available on all paid plans).

## Proof of Concept
1. Authenticate to the application as a standard user.
2. Create any report via the reporting module.
3. Click "Export to PDF" and intercept the request.
4. Change `customStylesheetUrl` to `http://169.254.169.254/latest/meta-data/iam/security-credentials/`.
5. The PDF output contains the IAM role name in the rendered content.
6. Repeat with the full role path to retrieve AccessKeyId, SecretAccessKey, and Token.

## Suggested Fix
- Implement URL allowlisting for the stylesheet URL (only allow specific CDN domains).
- Block requests to private IP ranges (RFC 1918) and link-local addresses (169.254.x.x).
- Upgrade to IMDSv2 on AWS to require session tokens for metadata access.
- Add a dedicated egress proxy for server-side HTTP requests with domain filtering.
