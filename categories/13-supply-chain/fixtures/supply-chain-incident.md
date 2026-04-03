# Incident Report: Unauthorized Data Exfiltration - Project Mercury

## Timeline

**2024-02-12 03:14 UTC** - Monitoring alert triggered: unusual outbound traffic from production API server (api-prod-03) to IP 185.220.101.42 on port 443.

**2024-02-12 03:22 UTC** - On-call engineer acknowledged alert. Initial assessment: traffic volume approximately 2.3 GB over 45 minutes, targeting an IP geolocated to a hosting provider in Eastern Europe.

**2024-02-12 03:45 UTC** - Network team confirmed the traffic originated from the Node.js API process (PID 28451). Process had been running since the last deployment on 2024-02-10.

**2024-02-12 04:10 UTC** - Server isolated from network. Forensic snapshot taken.

## Investigation Findings

### Deployment Analysis
The deployment on 2024-02-10 included a routine dependency update via `npm install`. The CI/CD pipeline (Jenkins) ran the standard build process. No code changes were made to the application source - only `package-lock.json` was modified.

### Dependency Diff
Comparing `package-lock.json` before and after the 2024-02-10 deployment:

```diff
- "colors": "1.4.0"
+ "colors": "1.4.2"
```

The `colors` package was updated from 1.4.0 to 1.4.2 as a transitive dependency of `cli-table3`. Version 1.4.2 was published to npm on 2024-02-09, approximately 24 hours before the deployment.

### Package Analysis
Examination of `colors@1.4.2` (since unpublished from npm):
- The package contained a minified file `lib/system/coreutils.min.js` not present in previous versions
- When deobfuscated, this file contained logic to:
  1. Read environment variables (including database connection strings and API keys)
  2. Enumerate files in `/etc/` and the application's working directory
  3. Compress and encrypt collected data using a hardcoded AES key
  4. Exfiltrate via HTTPS POST to multiple C2 endpoints including 185.220.101.42
- The malicious code was triggered by a `postinstall` script that modified the main entry point

### npm Audit Results
Running `npm audit` on the project after the incident returned zero vulnerabilities. The malicious version had not yet been flagged.

### Developer Access Review
- 4 developers had push access to the repository
- All developer machines passed endpoint security scans
- Git log showed the `package-lock.json` change was committed by the CI bot account (jenkins-bot)
- No developer manually modified `package-lock.json`
- The jenkins-bot account uses a deploy key with read-write access to the repository
- MFA is enforced on all developer GitHub accounts
- The jenkins server itself has SSH access via a shared key stored in Jenkins credentials

### npm Account Review
- The `colors` package maintainer account showed a login from a new IP on 2024-02-08
- The maintainer confirmed they did not publish version 1.4.2
- npm revoked the version on 2024-02-12 after being notified
- The maintainer's npm account did NOT have 2FA enabled

### Network Forensics
- Data exfiltrated: environment variables (.env contents), database connection strings, JWT signing keys, AWS credentials
- No evidence of lateral movement within the internal network
- No modifications to application source code on the server
- The exfiltration ran as part of the normal Node.js process

### Personnel Considerations
- One developer (Dev-C) gave notice 3 weeks prior and was in their final week
- Dev-C had standard access (same as other developers, no elevated permissions)
- Dev-C's commits in the past month were all code-reviewed and merged via PR process
- Dev-C did not commit the package-lock.json change
- The CI bot committed the lockfile change after running `npm install` during the build

## Questions for Analysis

1. What type of attack was this - supply chain compromise or insider threat?
2. What was the initial attack vector?
3. What security controls failed or were missing?
4. What remediation steps should be taken?
5. How could this have been prevented?
