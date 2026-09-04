# Fiscal Ledger Module (Archived)

## Overview
This directory contains the complete source code, HTML structure, modals, CSS styling, and JavaScript logic for the **Fiscal Ledger & Financial Management System** from X-29.

The module was moved to this archive to keep the live application focused on study routines, focus timers, syllabus tracking, and exam analytics.

## Archived Assets

| File | Description |
|---|---|
| [`fiscal-ledger.html`](./fiscal-ledger.html) | Complete HTML markup for the sidebar navigation button, the `#page-fiscal-ledger` page container, and all 7 fiscal modals (`fiscal-tx-modal`, `fiscal-budget-modal`, `fiscal-vault-modal`, `fiscal-deposit-modal`, `fiscal-vault-transfer-modal`, `fiscal-vault-to-budget-modal`, `fiscal-delete-modal`). |
| [`fiscal-ledger.js`](./fiscal-ledger.js) | Full JavaScript implementation of double-entry accounting mathematics (`A = L + OE`), 13-stage accounting cycle matrix, transaction management, budget variances, vault-to-vault transfers, multi-dimensional database filtering, and Chart.js visualizations. |
| [`fiscal-ledger.css`](./fiscal-ledger.css) | Mobile bottom-sheet layout styles and slide-up animations. |

## How to Restore

If you wish to re-enable the Fiscal Ledger in the live application:
1. **HTML**: Insert the contents of [`fiscal-ledger.html`](./fiscal-ledger.html) into [`index.html`](../../index.html) in the sidebar navigation, page section, and modals section.
2. **JavaScript**: Re-add the code from [`fiscal-ledger.js`](./fiscal-ledger.js) into [`js/script.js`](../../js/script.js) and register `'fiscal-ledger'` in `switchPage()`.
3. **CSS**: Re-add the styles from [`fiscal-ledger.css`](./fiscal-ledger.css) into [`css/style.css`](../../css/style.css).
