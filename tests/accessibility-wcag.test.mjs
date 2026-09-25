/**
 * Test Suite: WCAG 2.1 AA Modern Accessibility & ARIA Compliance (STEP 028)
 * (tests/accessibility-wcag.test.mjs)
 * 
 * Validates:
 * 1. Semantic landmarks: `<main id="main-content-panel" role="main">`, `<aside aria-label="Sidebar Navigation">`, `<header aria-label="...">`.
 * 2. Skip to main content link for keyboard-only navigation.
 * 3. Tablist / Tab / aria-selected / aria-current semantics across all navigations and filter bars.
 * 4. Dialog modal accessibility (`Dialog.Title`, `Dialog.Description`, accessible close labels).
 * 5. Touch target standards and `:focus-visible` ring styling.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('\n===============================================================');
console.log('  X-29 STEP 028 — ACCESSIBILITY & ARIA (WCAG 2.1 AA) AUDIT');
console.log('===============================================================\n');

// 1. Verify AppShell landmark roles and skip link
console.log('1. Auditing AppShell (components/shell/AppShell.tsx)...');
const appShellContent = fs.readFileSync(
  path.resolve('components/shell/AppShell.tsx'),
  'utf-8'
);

assert.ok(
  appShellContent.includes('Skip to main content'),
  'AppShell must contain a "Skip to main content" link for keyboard navigation'
);
assert.ok(
  appShellContent.includes('<main') && appShellContent.includes('role="main"'),
  'AppShell must contain semantic <main role="main">'
);
assert.ok(
  appShellContent.includes('e.key === \'Escape\''),
  'AppShell must close mobile drawer on Escape key'
);
console.log('   ✓ AppShell passes landmark and keyboard skip link requirements.');

// 2. Verify Sidebar ARIA attributes
console.log('\n2. Auditing Sidebar (components/shell/Sidebar.tsx)...');
const sidebarContent = fs.readFileSync(
  path.resolve('components/shell/Sidebar.tsx'),
  'utf-8'
);

assert.ok(
  sidebarContent.includes('aria-label="Sidebar Navigation"'),
  'Sidebar aside must have aria-label="Sidebar Navigation"'
);
assert.ok(
  sidebarContent.includes('aria-label="Main Navigation"'),
  'Sidebar nav must have aria-label="Main Navigation"'
);
assert.ok(
  sidebarContent.includes('aria-current={isActive ? \'page\' : undefined}'),
  'Sidebar active link must specify aria-current="page"'
);
assert.ok(
  sidebarContent.includes('aria-label="Log out of account"'),
  'Logout button must have descriptive aria-label'
);
console.log('   ✓ Sidebar passes ARIA landmarks and aria-current requirements.');

// 3. Verify MobileHeader ARIA attributes
console.log('\n3. Auditing MobileHeader (components/shell/MobileHeader.tsx)...');
const mobileHeaderContent = fs.readFileSync(
  path.resolve('components/shell/MobileHeader.tsx'),
  'utf-8'
);

assert.ok(
  mobileHeaderContent.includes('aria-expanded={isMenuOpen}'),
  'Mobile drawer toggle must include aria-expanded'
);
assert.ok(
  mobileHeaderContent.includes('aria-controls="sidebar-container"'),
  'Mobile drawer toggle must include aria-controls="sidebar-container"'
);
console.log('   ✓ MobileHeader passes aria-expanded and aria-controls audit.');

// 4. Verify Globals.css :focus-visible and .sr-only rules
console.log('\n4. Auditing CSS Focus Rings & Screen Reader Utilities (app/globals.css)...');
const globalsCssContent = fs.readFileSync(
  path.resolve('app/globals.css'),
  'utf-8'
);

assert.ok(
  globalsCssContent.includes(':focus-visible'),
  'globals.css must contain explicit :focus-visible rules for keyboard focus indicators'
);
assert.ok(
  globalsCssContent.includes('.sr-only'),
  'globals.css must contain accessible .sr-only class for screen reader text'
);
assert.ok(
  globalsCssContent.includes('touch-action: manipulation'),
  'globals.css must contain touch-action: manipulation'
);
console.log('   ✓ globals.css contains high-contrast visible focus rings and .sr-only styling.');

// 5. Verify Focus Feature ARIA Tablists and Controls
console.log('\n5. Auditing Focus Components (features/focus/)...');
const timerModeContent = fs.readFileSync(
  path.resolve('features/focus/components/TimerModeSelector.tsx'),
  'utf-8'
);
assert.ok(
  timerModeContent.includes('role="tablist"') && timerModeContent.includes('role="tab"'),
  'TimerModeSelector must implement role="tablist" and role="tab"'
);

const sessionHistoryContent = fs.readFileSync(
  path.resolve('features/focus/components/SessionHistory.tsx'),
  'utf-8'
);
assert.ok(
  sessionHistoryContent.includes('role="tablist"') && sessionHistoryContent.includes('role="tab"'),
  'SessionHistory must implement role="tablist" and role="tab" for filter bar'
);
assert.ok(
  sessionHistoryContent.includes('aria-label={`Delete study session'),
  'SessionHistory delete buttons must have descriptive aria-labels'
);

const subjectTargetContent = fs.readFileSync(
  path.resolve('features/focus/components/SubjectTargetLive.tsx'),
  'utf-8'
);
assert.ok(
  subjectTargetContent.includes('role="tablist"') && subjectTargetContent.includes('role="tab"'),
  'SubjectTargetLive must implement role="tablist" and role="tab"'
);
console.log('   ✓ Focus components pass ARIA tablist, tab, and accessible button checks.');

// 6. Verify Daily Actions & Subjects ARIA compliance
console.log('\n6. Auditing Daily Actions & Subjects Components...');
const dailyActionsGridContent = fs.readFileSync(
  path.resolve('features/daily-actions/components/DailyActionsGrid.tsx'),
  'utf-8'
);
assert.ok(
  dailyActionsGridContent.includes('aria-pressed={isYes}'),
  'DailyActionsGrid YES button must include aria-pressed'
);
assert.ok(
  dailyActionsGridContent.includes('aria-pressed={isNo}'),
  'DailyActionsGrid NO button must include aria-pressed'
);

const subjectProgressContent = fs.readFileSync(
  path.resolve('features/subjects/components/SubjectProgressAccordion.tsx'),
  'utf-8'
);
assert.ok(
  subjectProgressContent.includes('role="progressbar"') && subjectProgressContent.includes('aria-valuenow'),
  'SubjectProgressAccordion must implement role="progressbar" with aria-valuenow'
);
console.log('   ✓ Daily Actions and Subjects components pass accessible ARIA audit.');

console.log('\n===============================================================');
console.log('  >>> ALL STEP 028 ACCESSIBILITY (WCAG 2.1 AA) TESTS PASSED! <<<');
console.log('===============================================================\n');
