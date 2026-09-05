# X-29 Performance Baseline

## Date

2026-09-05

## Git

Baseline commit: 873c49a (chore: save stable X-29 baseline before performance modernization)
Performance branch: performance-modernization

## Environment

OS: Windows 11 (Microsoft Windows NT 10.0.26200.0)
Node: v24.15.0
npm: 11.12.1
Browser: Google Chrome / Chromium (Headless Lighthouse Audit)

## Application

Entry point: index.html (Client SPA shell) / js/dev-server.js (Node server)
Development command: npm run dev (node js/dev-server.js)

## File Sizes

Largest JS: js/script.js (1085.85 KB)
Largest CSS: pages/Focus/Focus.css (13.09 KB)
Largest HTML: index.html (285.51 KB)

Total JS: 2,605.71 KB (2.54 MB) across 25 files
Total CSS: 52.20 KB across 13 files
Total HTML: 715.82 KB (0.70 MB) across 14 files

## Lighthouse

Performance: 37
Accessibility: 80
Best Practices: 96
SEO: 91

## Core Web Vitals

LCP: 29.9 s
INP: N/A (Lab simulation — TTI: 30.0 s, TBT: 750 ms)
CLS: 0
FCP: 14.6 s
TTFB: 10 ms

## Network

Transferred: 5,020.0 KB (5.02 MB)
Requests: 47

## Firebase

Startup reads: 1 document read (/users/{uid} via onSnapshot)
Startup writes: 0
Realtime listeners: 1 Firestore snapshot listener (/users/{uid}) + 1 Auth listener
Largest queries: users/{uid} (monolithic document containing entire application database)

## Feature Verification

Dashboard: PASS
Analytics: PASS
Focus: PASS
Timer: PASS
Exam: PASS
Settings: PASS
Tasks: PASS
Authentication: PASS
Firebase: PASS
Navigation: PASS
Mobile: PASS
PWA: PASS

## Existing Problems

- TypeError on startup: Uncaught null reference error in updateManageDropdown() at js/script.js:10260:44 (called by js/script.js:2156) because document.getElementById('manage-type') is not present until Master Config fragment is loaded.
- Missing Service Worker: While manifest.json and app icons exist, there is no registered Service Worker for offline asset caching or PWA offline support.

## Known Performance Problems

- Monolithic unminified script: js/script.js is 20,683 lines (1,085.85 KB) loaded synchronously in head.
- Render-blocking external CDNs: Tailwind CSS JIT browser compiler (cdn.tailwindcss.com), Chart.js CDN, and Firebase v10 Compat libraries loaded in <head> block first contentful paint.
- Heavy initial DOM payload: index.html is 285.51 KB (3,861 lines) loaded upfront alongside large component files.
- Single-document database bottleneck: Any update (e.g. checking a task or saving timer) re-serializes the entire memory state and writes a monolithic payload to Firestore.
- Absence of build pipeline / bundle optimization: Total JS across project is 2.54 MB without code-splitting, tree-shaking, or minification.

## Baseline Rules

No optimization has been performed during Phase 1.

This document represents the known-good X-29 baseline before performance modernization.
