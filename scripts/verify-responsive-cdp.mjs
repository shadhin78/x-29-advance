import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PORT = 9226;
const BASE_URL = 'http://localhost:3005';
const SNAPSHOTS_DIR = path.join(process.cwd(), 'scratch', 'responsive-snapshots');
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360px_CompactMobile', width: 360, height: 800, deviceScaleFactor: 2, isMobile: true },
  { name: '390px_iPhone13', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true },
  { name: '414px_LargeMobile', width: 414, height: 896, deviceScaleFactor: 3, isMobile: true },
  { name: '768px_TabletPortrait', width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true },
  { name: '1024px_TabletLandscape', width: 1024, height: 768, deviceScaleFactor: 1, isMobile: false },
  { name: '1440px_Desktop', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
];

const PAGES = [
  { name: 'Dashboard', path: '/' },
  { name: 'Focus', path: '/focus' },
  { name: 'DailyActions', path: '/daily-actions' },
  { name: 'MonthlySetup', path: '/daily-actions/monthly-setup' },
  { name: 'Schedule', path: '/schedule' },
  { name: 'Subjects', path: '/subjects' },
  { name: 'Pace', path: '/pace' },
  { name: 'Outcome', path: '/outcome' },
  { name: 'Exam', path: '/exam' },
  { name: 'MasterConfig', path: '/master-config' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Login', path: '/login' },
];

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[CDP] Launching browser: ${CHROME_PATH}`);
  const userDataDir = path.join(os.tmpdir(), 'chrome-resp-test-' + Date.now());
  const proc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  let browserWsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://localhost:${PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        browserWsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!browserWsUrl) {
    proc.kill();
    throw new Error('Failed to connect to browser CDP port');
  }

  console.log(`[CDP] Connected to browser.`);

  const auditReport = [];

  for (const page of PAGES) {
    const url = `${BASE_URL}${page.path}`;
    console.log(`\n========================================`);
    console.log(`Auditing Page: ${page.name} (${page.path})`);
    console.log(`========================================`);

    for (const vp of VIEWPORTS) {
      const targetRes = await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: 'PUT' });
      const targetData = await targetRes.json();
      const pageWsUrl = targetData.webSocketDebuggerUrl;
      const targetId = targetData.id;

      const client = new CDPClient(pageWsUrl);
      await client.connect();

      await client.send('Page.enable');
      await client.send('DOM.enable');
      await client.send('Runtime.enable');

      // Inject E2E Mock Auth before document loads so AuthGate lets the real page render
      await client.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `try { localStorage.setItem('X29_E2E_MOCK_AUTH', 'true'); } catch(e){}`
      });

      // Set mobile emulation
      if (vp.isMobile) {
        await client.send('Emulation.setUserAgentOverride', {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
        });
        await client.send('Emulation.setTouchEmulationEnabled', { enabled: true });
      }

      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
        mobile: vp.isMobile,
        fitWindow: false
      });

      // Navigate to page
      await client.send('Page.navigate', { url });
      await sleep(1200); // Wait for render and animations

      // Evaluate responsive checks
      const evalRes = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const innerW = window.innerWidth;
          const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
          const overflow = scrollW > innerW + 1;

          // Check main content panel scrollWidth vs clientWidth
          const mainPanel = document.getElementById('main-content-panel');
          const mainScrollW = mainPanel ? mainPanel.scrollWidth : 0;
          const mainClientW = mainPanel ? mainPanel.clientWidth : 0;
          const panelOverflow = mainPanel ? (mainScrollW > mainClientW + 1) : false;

          // Find specific offending elements if overflow exists
          const offending = [];
          if (overflow || panelOverflow) {
            const all = document.querySelectorAll('*');
            const mainRect = mainPanel ? mainPanel.getBoundingClientRect() : null;
            const threshold = mainRect ? Math.min(innerW, mainRect.right) : innerW;
            for (const el of all) {
              const r = el.getBoundingClientRect();
              if (r.right > threshold + 1) {
                offending.push({
                  tag: el.tagName,
                  id: el.id,
                  cls: el.className ? String(el.className).substring(0, 60) : '',
                  right: Math.round(r.right),
                  width: Math.round(r.width),
                  threshold: Math.round(threshold)
                });
                if (offending.length >= 6) break;
              }
            }
          }

          // Check inputs font size on mobile
          const smallInputs = [];
          if (innerW < 768) {
            const inputs = document.querySelectorAll('input, select, textarea');
            for (const inp of inputs) {
              const fs = window.getComputedStyle(inp).fontSize;
              const fsNum = parseFloat(fs);
              if (fsNum < 15.5) {
                smallInputs.push({ id: inp.id, fs });
              }
            }
          }

          // Check interactive button touch targets on mobile
          const smallButtons = [];
          if (innerW < 768) {
            const btns = document.querySelectorAll('button:not([hidden]), a[href]:not([hidden])');
            for (const btn of btns) {
              const r = btn.getBoundingClientRect();
              // Only check visible elements that are part of the main UI
              if (r.width > 0 && r.height > 0 && (r.width < 32 || r.height < 32)) {
                // If smaller than 32px
                smallButtons.push({
                  id: btn.id || btn.textContent?.trim().substring(0, 15),
                  w: Math.round(r.width),
                  h: Math.round(r.height)
                });
                if (smallButtons.length >= 5) break;
              }
            }
          }

          return {
            innerW,
            scrollW,
            overflow,
            offending,
            smallInputs,
            smallButtons,
            mainScrollW,
            mainClientW,
            panelOverflow
          };
        })()`,
        returnByValue: true
      });

      const result = evalRes.result.value;
      const isFailed = result.overflow || result.panelOverflow;
      const statusStr = isFailed ? 'FAIL (OVERFLOW)' : 'PASS (ZERO OVERFLOW)';

      console.log(`  [${vp.name} | ${vp.width}x${vp.height}]: ${statusStr} (Inner: ${result.innerW}px, Scroll: ${result.scrollW}px, Panel: ${result.mainClientW}/${result.mainScrollW}px)`);
      if (result.overflow || result.panelOverflow) {
        console.log(`    Offending elements:`, result.offending);
      }
      if (result.smallInputs && result.smallInputs.length > 0) {
        console.log(`    Small inputs (<16px): ${result.smallInputs.length}`);
      }

      auditReport.push({
        page: page.name,
        path: page.path,
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        innerW: result.innerW,
        scrollW: result.scrollW,
        overflow: result.overflow,
        panelOverflow: result.panelOverflow,
        offending: result.offending,
        smallInputsCount: result.smallInputs ? result.smallInputs.length : 0,
        smallButtonsCount: result.smallButtons ? result.smallButtons.length : 0
      });

      // Capture screenshot for key viewports
      if (['360px_CompactMobile', '768px_TabletPortrait', '1440px_Desktop'].includes(vp.name)) {
        const screenshotRes = await client.send('Page.captureScreenshot', {
          format: 'png',
          clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 1 }
        });
        const imgBuffer = Buffer.from(screenshotRes.data, 'base64');
        const filename = `${page.name}_${vp.name}.png`;
        fs.writeFileSync(path.join(SNAPSHOTS_DIR, filename), imgBuffer);
      }

      client.close();
      await fetch(`http://localhost:${PORT}/json/close/${targetId}`);
    }
  }

  proc.kill();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}

  // Summarize results
  console.log(`\n========================================`);
  console.log(`RESPONSIVE AUDIT SUMMARY`);
  console.log(`========================================`);
  const totalTests = auditReport.length;
  const passedTests = auditReport.filter(r => !r.overflow && !r.panelOverflow).length;
  const failedTests = auditReport.filter(r => r.overflow || r.panelOverflow).length;
  console.log(`Total Viewport Tests: ${totalTests}`);
  console.log(`Passed (Zero Overflow): ${passedTests}`);
  console.log(`Failed (Overflow): ${failedTests}`);

  fs.writeFileSync(
    path.join(process.cwd(), 'scratch', 'responsive-audit-results.json'),
    JSON.stringify(auditReport, null, 2)
  );

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error in responsive test:', err);
  process.exit(1);
});
