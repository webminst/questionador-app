# Security Review

Date: 2026-03-25
Scope: client-side authentication, credential handling, state persistence, and attack surface in current SPA architecture.

## Executive Summary

The application is functional and stable, but it still follows a client-only trust model. For production, this model is insecure by design for authentication and sensitive state integrity.

Immediate hardening was implemented in this cycle:
- Email normalization in auth flow (trim + lowercase) for login and registration.
- Registration input validation for email format and password strength.
- Less predictable user ID generation via crypto.randomUUID fallback.

Validation status after hardening:
- Lint: pass
- Tests: 37/37 pass
- Build: pass

## Findings (Ordered by Severity)

1. Critical: Client-side password verification and user database
- Location: src/hooks/useAuthFlow.ts
- Issue: Credentials are validated entirely in the browser against local state.
- Risk: Any user can inspect/modify state and bypass or alter auth logic.
- Recommendation:
  - Move auth to backend (JWT/session-based).
  - Never keep authoritative credential data in client state.

2. High: Weak password hashing algorithm
- Location: src/domain/utils.ts (simpleHash)
- Issue: Uses non-cryptographic hash (djb2-style), no salt, fast to brute force.
- Risk: Offline cracking is trivial if storage is exposed.
- Recommendation:
  - Use Argon2id/bcrypt/scrypt on server with per-user salt.
  - Keep only session/token in client.

3. High: Sensitive app state in localStorage
- Location: src/lib/persistence.ts
- Issue: Full app state is persisted in localStorage.
- Risk: Data exfiltration/tampering under XSS or shared device scenarios.
- Recommendation:
  - Avoid storing secrets in localStorage.
  - Store only non-sensitive cache; use server-side source of truth.
  - Add integrity checks and token expiration strategy.

4. Medium: No login attempt throttling
- Location: src/hooks/useAuthFlow.ts
- Issue: Unlimited login attempts with immediate feedback.
- Risk: Brute-force attempts are not rate-limited.
- Recommendation:
  - Add server-side rate limiting + lockout/backoff.
  - In client-only mode, add temporary lockouts as partial mitigation.

5. Medium: Input trust boundaries are local-only
- Location: src/hooks/useAuthFlow.ts and form flows
- Issue: Validation currently runs in client, without authoritative server validation.
- Risk: Validation can be bypassed by manipulating runtime state.
- Recommendation:
  - Duplicate and enforce all validation on backend APIs.

## Changes Implemented in This Pass

1. Auth hardening
- File: src/hooks/useAuthFlow.ts
- Applied:
  - normalizeEmail helper used in register/login and duplicate checks.
  - Registration now validates name, email format, and password strength.
  - Login now blocks empty email/password attempts.
  - Temporary lockout after repeated invalid login attempts (5 attempts, 30s block).
  - User ID generation upgraded from timestamp-only to crypto.randomUUID fallback.

2. Security-focused tests
- File: src/hooks/useAuthFlow.test.ts
- Added tests:
  - Login accepts normalized email input (spaces/case differences).
  - Registration blocks invalid email and weak password.
  - Login is temporarily blocked after repeated invalid attempts.
  - Login works again after lockout expiration.

## Residual Risk

Even with the hardening above, core auth remains insecure for production because trust and credential validation are still browser-side.

## Prioritized Roadmap

P0 (Must-do before production)
1. Build backend auth API (register/login/refresh/logout).
2. Replace simpleHash with Argon2/bcrypt on server.
3. Remove credential material from localStorage-based state.

P1 (Strongly recommended)
1. Add rate limit + lockout policy.
2. Add CSRF/XSS hardening policy where applicable.
3. Add structured security logging and monitoring.

P2 (Nice to have)
1. Device/session management UX.
2. Password reset and email verification.
3. Threat model document for the app domain.
