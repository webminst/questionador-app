# Performance Audit

Date: 2026-03-25
Scope: route-level loading, bundle composition, and practical optimization opportunities.

## Summary

A route-level code splitting strategy was implemented in App orchestration to defer feature screens until needed. This significantly reduced the initial application chunk and moved most screen code to async chunks.

Main result:
- Entry chunk reduced from 90.79 kB (23.30 kB gzip) to 32.98 kB (10.33 kB gzip).
- Heavy chart vendor chunk (recharts path) remains large, but is now loaded only when profile is opened.

## Changes Applied

File changed:
- src/App.tsx

Optimizations:
- Introduced React lazy loading for screen-level features.
- Wrapped routed content in Suspense fallback.
- Deferred loading for:
  - AuthScreen
  - HomeScreen
  - DisciplinesScreen
  - QuizScreen
  - ResultsScreen
  - LeaderboardScreen
  - ProfileScreen
  - QuestionsScreen
  - Onboarding
  - QuizConfigModal

## Build Metrics (Before vs After)

Before:
- dist/assets/index-WRW6e1mc.js: 90.79 kB (23.30 kB gzip)
- dist/assets/react-vendor-BLGgDnlQ.js: 178.68 kB (56.48 kB gzip)
- dist/assets/charts-meu_SSeP.js: 349.75 kB (103.71 kB gzip)

After:
- dist/assets/index-CT5la_9P.js: 32.98 kB (10.33 kB gzip)
- dist/assets/react-vendor-BLGgDnlQ.js: 178.68 kB (56.48 kB gzip)
- dist/assets/charts-meu_SSeP.js: 349.75 kB (103.71 kB gzip)
- New async feature chunks (examples):
  - ProfileScreen-DKD3FMwb.js: 10.81 kB (3.10 kB gzip)
  - QuestionsScreen-_6Z_v9e-.js: 14.01 kB (3.81 kB gzip)
  - DisciplinesScreen-cY6uCm7w.js: 6.76 kB (2.16 kB gzip)

Interpretation:
- Initial JS payload improved materially.
- Charts vendor remains the dominant payload, now better isolated from initial load path.

## Runtime Impact Expectations

Expected improvements:
- Faster initial render and quicker first interaction on low-end devices.
- Better navigation responsiveness for non-profile flows.
- Reduced startup cost for first-time users.

Trade-offs:
- First navigation to a lazy-loaded screen incurs a one-time async fetch.
- Slight increase in number of JS requests (small chunks), acceptable for modern HTTP/2+.

## Next Recommendations

1. Add modulepreload/prefetch hints for likely next screens
- Example: prefetch profile chunk when user stays on home for N seconds.

2. Keep charts isolated to profile-only surface
- Avoid importing any chart symbols outside profile module tree.

3. Consider alternative chart libraries or custom light chart
- If profile usage is frequent on mobile networks, evaluate lighter chart rendering options.

4. Track Web Vitals in production
- Add real-user monitoring for LCP, INP, CLS and script load timings.

5. Optional: split auth and app shells
- If authentication is dominant, optimize auth path with dedicated shell and delayed app shell load.

## Validation

Post-change checks:
- Lint: pass
- Tests: 33/33 pass
- Build: pass
