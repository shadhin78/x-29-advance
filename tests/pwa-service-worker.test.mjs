/**
 * X-29 STEP 029 — Production PWA Service Worker & Manifest Test Suite
 * 
 * Verifies:
 * 1. Web App Manifest schema, icons, and navigation shortcuts
 * 2. Service Worker cache lifecycle (install, activate, fetch, message)
 * 3. Cache strategies (Network-First for navigation, Stale-While-Revalidate for static assets)
 * 4. Direct network bypass for Firebase/Firestore/Auth to support native offline IndexedDB sync
 * 5. App metadata and layout registration
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve('public/manifest.json');
const swPath = path.resolve('public/sw.js');
const layoutPath = path.resolve('app/layout.tsx');
const providersPath = path.resolve('components/providers/providers.tsx');
const rootManifestPath = fs.existsSync('manifest.json') ? path.resolve('manifest.json') : path.resolve('archive/legacy-config/manifest.json');

test('1. Web App Manifest (public/manifest.json) Schema & Metadata', () => {
  assert.ok(fs.existsSync(manifestPath), 'public/manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(typeof manifest.name, 'string', 'Manifest name must be defined');
  assert.equal(manifest.short_name, 'X-29', 'Manifest short_name should be X-29');
  assert.equal(manifest.display, 'standalone', 'Display mode must be standalone for native PWA feel');
  assert.equal(manifest.start_url, '/', 'start_url must be /');
  assert.equal(manifest.scope, '/', 'scope must be /');
  assert.equal(manifest.theme_color, '#0b0f19', 'Theme color must match dark slate palette');
  assert.equal(manifest.background_color, '#0b0f19', 'Background color must match theme');

  // Validate icons
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'Must provide at least 2 icon sizes');
  const has192 = manifest.icons.some(i => i.sizes.includes('192x192'));
  const has512 = manifest.icons.some(i => i.sizes.includes('512x512'));
  const hasMaskable = manifest.icons.some(i => i.purpose && i.purpose.includes('maskable'));
  assert.ok(has192, 'Manifest must contain 192x192 icon');
  assert.ok(has512, 'Manifest must contain 512x512 icon');
  assert.ok(hasMaskable, 'Manifest must include maskable icon for Android adaptive icons');

  // Validate shortcuts
  assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3, 'Must provide at least 3 app shortcuts');
  const shortcutUrls = manifest.shortcuts.map(s => s.url);
  assert.ok(shortcutUrls.includes('/focus'), 'Shortcut for /focus must be present');
  assert.ok(shortcutUrls.includes('/daily-actions'), 'Shortcut for /daily-actions must be present');
  assert.ok(shortcutUrls.includes('/'), 'Shortcut for Dashboard / must be present');
});

test('2. Service Worker (public/sw.js) Precache & Route Coverage', () => {
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
  const swCode = fs.readFileSync(swPath, 'utf8');

  // Cache name versioning
  assert.match(swCode, /const CACHE_NAME = 'x29-pwa-v\d+'/, 'Service worker must declare a versioned cache name');

  // Precache routes
  const requiredRoutes = [
    "'/'",
    "'/focus'",
    "'/daily-actions'",
    "'/daily-actions/monthly-setup'",
    "'/schedule'",
    "'/subjects'",
    "'/pace'",
    "'/outcome'",
    "'/exam'",
    "'/master-config'",
    "'/analytics'",
    "'/login'"
  ];

  for (const route of requiredRoutes) {
    assert.ok(swCode.includes(route), `Service worker precache must include route ${route}`);
  }

  // Precache static assets
  assert.ok(swCode.includes("'/manifest.json'"), 'Precache must include manifest.json');
  assert.ok(swCode.includes("'/icons/x-29-adv-logo.jpeg'"), 'Precache must include logo icon');
});

test('3. Service Worker Lifecycle Handlers (Install, Activate, Message)', () => {
  const swCode = fs.readFileSync(swPath, 'utf8');

  // Install lifecycle
  assert.match(swCode, /self\.addEventListener\('install'/, 'Install event listener must be registered');
  assert.match(swCode, /self\.skipWaiting\(\)/, 'Install handler must call skipWaiting() for immediate activation');

  // Activate lifecycle
  assert.match(swCode, /self\.addEventListener\('activate'/, 'Activate event listener must be registered');
  assert.match(swCode, /caches\.delete\(key\)/, 'Activate handler must purge outdated caches');
  assert.match(swCode, /self\.clients\.claim\(\)/, 'Activate handler must claim active clients immediately');

  // Message lifecycle
  assert.match(swCode, /self\.addEventListener\('message'/, 'Message event listener must be registered');
  assert.ok(swCode.includes('SKIP_WAITING'), 'Must handle SKIP_WAITING message');
});

test('4. Service Worker Fetch Strategies & Firebase Bypass', () => {
  const swCode = fs.readFileSync(swPath, 'utf8');

  // Firebase / Firestore bypass
  assert.ok(swCode.includes('firebaseio.com'), 'Must bypass firebaseio.com');
  assert.ok(swCode.includes('firestore.googleapis.com'), 'Must bypass firestore.googleapis.com');
  assert.ok(swCode.includes('identitytoolkit.googleapis.com'), 'Must bypass identitytoolkit.googleapis.com');
  assert.ok(swCode.includes("url.pathname.startsWith('/api/')"), 'Must bypass /api/ routes');

  // Navigation requests: Network-First with Cache Fallback
  assert.match(swCode, /event\.request\.mode === 'navigate'|req\.mode === 'navigate'/, 'Navigation requests must be intercepted');
  assert.match(swCode, /caches\.match\('\/focus'\)|caches\.match\('\/'\)/, 'Navigation failure must fallback to cached app shell');

  // Static assets: Stale-While-Revalidate / Cache-First
  assert.ok(swCode.includes('/_next/static/'), 'Must cache Next.js static chunks');
  assert.ok(swCode.includes("'image'"), 'Must cache images');
  assert.ok(swCode.includes("'font'"), 'Must cache fonts');
  assert.ok(swCode.includes("'style'"), 'Must cache styles');
  assert.ok(swCode.includes("'audio'"), 'Must cache audio assets');
});

test('5. Root Layout & Providers Service Worker Registration', () => {
  assert.ok(fs.existsSync(layoutPath), 'app/layout.tsx must exist');
  const layoutCode = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(layoutCode.includes("manifest: '/manifest.json'"), 'Layout metadata must include manifest path');
  assert.ok(layoutCode.includes('appleWebApp'), 'Layout metadata must include appleWebApp configuration');

  assert.ok(fs.existsSync(providersPath), 'components/providers/providers.tsx must exist');
  const providersCode = fs.readFileSync(providersPath, 'utf8');

  assert.match(providersCode, /navigator\.serviceWorker\s*\.register\('\/sw\.js'/, 'Providers must register /sw.js');
  assert.ok(providersCode.includes("scope: '/'"), 'Registration must specify root scope');
});

test('6. Backward Compatibility with Root Manifest', () => {
  assert.ok(fs.existsSync(rootManifestPath), 'Root manifest.json must exist');
  const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, 'utf8'));

  assert.equal(rootManifest.name, 'X-29');
  assert.equal(rootManifest.display, 'standalone');
  assert.ok(Array.isArray(rootManifest.icons) && rootManifest.icons.length > 0);
});
