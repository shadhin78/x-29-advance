/**
 * X-29 STEP 030 — Production Security Headers & Vercel Edge Configuration Test Suite
 * 
 * Verifies:
 * 1. Content-Security-Policy (CSP) with complete Firebase, fonts, and media whitelisting
 * 2. Strict-Transport-Security (HSTS), X-Frame-Options: DENY, X-Content-Type-Options: nosniff
 * 3. Immutable static asset caching and Service Worker no-cache revalidation
 * 4. vercel.json edge routing and header parity
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const nextConfigPath = path.resolve('next.config.ts');
const vercelConfigPath = path.resolve('vercel.json');

test('1. next.config.ts Security Headers & CSP Configuration', () => {
  assert.ok(fs.existsSync(nextConfigPath), 'next.config.ts must exist');
  const configCode = fs.readFileSync(nextConfigPath, 'utf8');

  // CSP Directives check
  assert.ok(configCode.includes('Content-Security-Policy'), 'Must define Content-Security-Policy header');
  assert.ok(configCode.includes("default-src 'self'"), 'CSP must specify default-src');
  assert.ok(configCode.includes("https://*.firebaseio.com"), 'CSP must whitelist Firebase Realtime / Firestore');
  assert.ok(configCode.includes("https://firestore.googleapis.com"), 'CSP must whitelist Firestore Google APIs');
  assert.ok(configCode.includes("https://identitytoolkit.googleapis.com"), 'CSP must whitelist Identity Toolkit for Auth');
  assert.ok(configCode.includes("https://fonts.googleapis.com"), 'CSP must whitelist Google Fonts stylesheet');
  assert.ok(configCode.includes("https://fonts.gstatic.com"), 'CSP must whitelist Google Fonts assets');
  assert.ok(configCode.includes("object-src 'none'"), 'CSP must disallow plugins');
  assert.ok(configCode.includes("frame-ancestors 'none'"), 'CSP must prevent framing/clickjacking');

  // Standard Security Headers check
  assert.ok(configCode.includes("'X-Frame-Options'"), 'Must set X-Frame-Options');
  assert.ok(configCode.includes("'DENY'"), 'X-Frame-Options must be DENY');
  assert.ok(configCode.includes("'X-Content-Type-Options'"), 'Must set X-Content-Type-Options');
  assert.ok(configCode.includes("'nosniff'"), 'X-Content-Type-Options must be nosniff');
  assert.ok(configCode.includes("'Strict-Transport-Security'"), 'Must configure HSTS');
  assert.ok(configCode.includes('max-age=63072000'), 'HSTS must specify 2-year max-age');
  assert.ok(configCode.includes('preload'), 'HSTS must include preload directive');
  assert.ok(configCode.includes("'Referrer-Policy'"), 'Must configure Referrer-Policy');
  assert.ok(configCode.includes("'Permissions-Policy'"), 'Must configure Permissions-Policy');
});

test('2. next.config.ts Static & Dynamic Cache Headers', () => {
  const configCode = fs.readFileSync(nextConfigPath, 'utf8');

  // Service Worker revalidation
  assert.ok(configCode.includes('/sw.js'), 'Must define rule for /sw.js');
  assert.ok(configCode.includes('max-age=0, must-revalidate'), 'Service worker must not be cached stale');

  // Icons and manifest caching
  assert.ok(configCode.includes('/icons/(.*)'), 'Must define caching for icons');
  assert.ok(configCode.includes('/manifest.json'), 'Must define caching for manifest.json');
  assert.ok(configCode.includes('stale-while-revalidate'), 'Must use stale-while-revalidate for assets');
});

test('3. vercel.json Edge Security & Header Parity', () => {
  assert.ok(fs.existsSync(vercelConfigPath), 'vercel.json must exist');
  const vercelJson = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

  assert.equal(vercelJson.cleanUrls, true, 'vercel.json must enable cleanUrls');
  assert.equal(vercelJson.framework, 'nextjs', 'vercel.json must declare nextjs framework');

  assert.ok(Array.isArray(vercelJson.headers) && vercelJson.headers.length >= 4, 'vercel.json must declare edge headers');

  const rootRule = vercelJson.headers.find(h => h.source === '/(.*)');
  assert.ok(rootRule, 'Must define wildcard route headers in vercel.json');

  const headerKeys = rootRule.headers.map(h => h.key);
  assert.ok(headerKeys.includes('Content-Security-Policy'), 'Edge rule must include CSP');
  assert.ok(headerKeys.includes('X-Frame-Options'), 'Edge rule must include X-Frame-Options');
  assert.ok(headerKeys.includes('X-Content-Type-Options'), 'Edge rule must include X-Content-Type-Options');
  assert.ok(headerKeys.includes('Strict-Transport-Security'), 'Edge rule must include HSTS');
  assert.ok(headerKeys.includes('Referrer-Policy'), 'Edge rule must include Referrer-Policy');
  assert.ok(headerKeys.includes('Permissions-Policy'), 'Edge rule must include Permissions-Policy');

  const swRule = vercelJson.headers.find(h => h.source === '/sw.js');
  assert.ok(swRule, 'Must define /sw.js edge rule');
  const swCacheControl = swRule.headers.find(h => h.key === 'Cache-Control');
  assert.equal(swCacheControl.value, 'public, max-age=0, must-revalidate');

  const staticRule = vercelJson.headers.find(h => h.source === '/_next/static/(.*)');
  assert.ok(staticRule, 'Must define /_next/static/(.*) edge rule');
  const staticCacheControl = staticRule.headers.find(h => h.key === 'Cache-Control');
  assert.equal(staticCacheControl.value, 'public, max-age=31536000, immutable');
});
