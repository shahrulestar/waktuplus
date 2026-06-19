# Security Policy

## Supported versions

Security fixes are applied to the latest version on the default branch (`main`).

| Version | Supported |
| ------- | --------- |
| Latest on `main` | Yes |
| Older releases | No |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you believe you have found a security issue, report it privately to:

**security@waktuplus.xyz**

Include as much detail as possible:

- Description of the issue
- Steps to reproduce
- Affected URLs or components (for example, `/api/prayer`, display settings)
- Potential impact
- Any suggested fix (optional)

## What to expect

- We will acknowledge your report within **5 business days**.
- We will investigate and share an initial assessment as soon as possible.
- We will keep you informed of progress and coordinate disclosure timing with you.
- We appreciate responsible disclosure and will credit reporters when appropriate, unless you prefer to remain anonymous.

## Scope

The following are generally **in scope**:

- Cross-site scripting (XSS) or injection in the Waktu+ web app
- Authentication or authorization flaws (if introduced in future features)
- Server-side request forgery or unsafe proxy behavior in API routes
- Sensitive data exposure through the application or repository

The following are generally **out of scope**:

- Issues in third-party services (JAKIM prayer data APIs, Cloudflare, analytics providers)
- Social engineering or physical access to a mosque display device
- Denial-of-service attacks
- Missing security headers or best-practice hardening with no demonstrated exploit
- Vulnerabilities in dependencies already fixed in a newer supported release

## Safe disclosure

Please give us reasonable time to investigate and release a fix before public disclosure. We ask for at least **90 days** unless a shorter timeline is agreed together.

Thank you for helping keep Waktu+ safe for public use.
