import { spawn } from 'child_process';
import path from 'path';

process.env.ANALYZE = 'true';

console.log('=== X-29 Advance — Running Next.js Bundle Analyzer ===\n');

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(npxCmd, ['next', 'build', '--webpack'], {
  env: { ...process.env, ANALYZE: 'true' },
  stdio: 'inherit',
  shell: true,
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`Next.js build with analyzer failed with exit code: ${code}`);
    process.exit(code);
  }
  console.log('\nBundle analysis build completed successfully.');
});
